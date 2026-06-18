import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import { prisma } from "./prisma";

interface WhatsappClientInfo {
  client: Client | null;
  qrCode: string | null;
  status: "initializing" | "qr_ready" | "connected" | "disconnected";
  error: string | null;
}

// Global registry of active WhatsApp client instances, keyed by account ID.
// Using globalThis ensures instances persist across Next.js dev hot-reloads.
const globalForWhatsapp = globalThis as unknown as {
  whatsappClients: Record<number, WhatsappClientInfo> | undefined;
  whatsappEventListeners: Record<number, Array<(event: string, data: any) => void>> | undefined;
};

if (!globalForWhatsapp.whatsappClients) {
  globalForWhatsapp.whatsappClients = {};
}
if (!globalForWhatsapp.whatsappEventListeners) {
  globalForWhatsapp.whatsappEventListeners = {};
}

export const whatsappClients = globalForWhatsapp.whatsappClients;
export const whatsappEventListeners = globalForWhatsapp.whatsappEventListeners;

export function addWhatsappEventListener(akunId: number, cb: (event: string, data: any) => void) {
  if (!whatsappEventListeners[akunId]) {
    whatsappEventListeners[akunId] = [];
  }
  whatsappEventListeners[akunId].push(cb);
  return () => {
    whatsappEventListeners[akunId] = (whatsappEventListeners[akunId] || []).filter((item) => item !== cb);
  };
}

export function emitWhatsappEvent(akunId: number, event: string, data: any) {
  const listeners = whatsappEventListeners[akunId];
  if (listeners) {
    listeners.forEach((cb) => {
      try {
        cb(event, data);
      } catch (err) {
        console.error("Error calling whatsapp event listener:", err);
      }
    });
  }
}

export function getWhatsappClient(akunId: number): WhatsappClientInfo {
  if (!whatsappClients[akunId]) {
    whatsappClients[akunId] = {
      client: null,
      qrCode: null,
      status: "disconnected",
      error: null,
    };
  }
  return whatsappClients[akunId];
}

export function initializeWhatsappClient(
  akunId: number,
  method: "qr" | "pairing" = "qr"
): WhatsappClientInfo {
  const clientInfo = getWhatsappClient(akunId);

  // If already connecting or active, return the existing client info
  if (
    clientInfo.status === "initializing" ||
    clientInfo.status === "qr_ready" ||
    clientInfo.status === "connected"
  ) {
    return clientInfo;
  }

  clientInfo.status = "initializing";
  clientInfo.qrCode = null;
  clientInfo.error = null;

  try {
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: `whatsapp-akun-${akunId}`,
        dataPath: "./.wwebjs_auth", // Persist session files in the project directory
      }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      },
    });

    client.on("qr", async (qr) => {
      if (method === "pairing") {
        try {
          const account = await prisma.m_akun_sosmed.findFirst({
            where: { id: akunId },
          });
          const cleanPhone = (account?.username || "").replace(/[^\d]/g, "");
          if (!cleanPhone) {
            throw new Error("Nomor handphone tidak ditemukan atau kosong untuk pairing.");
          }
          console.log(`[WhatsApp Akun ${akunId}] Requesting pairing code for ${cleanPhone}...`);
          const code = await client.requestPairingCode(cleanPhone);
          clientInfo.status = "qr_ready";
          clientInfo.qrCode = `pairing_code:${code}`;
          console.log(`[WhatsApp Akun ${akunId}] Pairing code generated: ${code}`);
        } catch (pairErr: any) {
          console.error(`[WhatsApp Akun ${akunId}] Failed to request pairing code:`, pairErr);
          clientInfo.status = "disconnected";
          clientInfo.error = pairErr.message || "Gagal membuat pairing code";
        }
      } else {
        clientInfo.status = "qr_ready";
        clientInfo.qrCode = qr;
        console.log(`[WhatsApp Akun ${akunId}] QR Code ready to be scanned.`);
      }
    });

    client.on("ready", async () => {
      clientInfo.status = "connected";
      clientInfo.qrCode = null;
      console.log(`[WhatsApp Akun ${akunId}] Client is fully connected and ready.`);
      
      // Update account status in DB
      try {
        await prisma.m_akun_sosmed.update({
          where: { id: akunId },
          data: { status: "terhubung" },
        });
      } catch (dbErr) {
        console.error("Failed to update WhatsApp account status in DB on ready:", dbErr);
      }
    });

    // Webhook event listener: Realtime message sync (no-polling approach for messages)
    client.on("message_create", async (msg) => {
      if (!msg.body) return;
      try {
        const platformMsgId = msg.id.id;
        const isFromMe = msg.fromMe;
        const msgTime = new Date(msg.timestamp * 1000);
        const contactId = isFromMe ? msg.to : msg.from;
        const isGroupMsg = contactId.endsWith("@g.us");

        // Deduplicate by platform_msg_id
        const existingByMsgId = await prisma.m_chat.findFirst({
          where: { akun_id: akunId, platform_msg_id: platformMsgId },
        });
        if (existingByMsgId) return;

        const chat = await msg.getChat();
        const chatName = chat.name || chat.id.user || "WhatsApp User";

        if (isGroupMsg) {
          // ── Group: consolidate all messages into ONE thread per group ──
          const groupThread = await prisma.m_chat.findFirst({
            where: { akun_id: akunId, sender_id: contactId, dihapus_pada: null },
            orderBy: { dibuat_pada: "asc" },
          });

          if (!groupThread) {
            // First ever message from this group → create the anchor thread
            await prisma.m_chat.create({
              data: {
                akun_id: akunId,
                sender_id: contactId,
                sender_nama: chatName,
                pesan: msg.body,
                sudah_dibaca: false,
                status: "baru",
                platform_msg_id: platformMsgId,
                dibuat_pada: msgTime,
              },
            });
            console.log(`[WhatsApp Akun ${akunId}] Group thread created: ${chatName}`);
          } else {
            // Subsequent message → append as balasan on the existing group thread
            // For incoming group messages, encode sender: "incoming:AUTHOR_NUMBER"
            const rawAuthor = (msg as any).author ?? "";
            const authorNumber = String(rawAuthor).replace("@c.us", "") || "Anggota";
            const dikirimOleh = isFromMe ? "admin" : `incoming:${authorNumber}`;

            // Deduplicate: check if outgoing message was already saved by API route
            if (isFromMe) {
              const existingGroupReply = await prisma.c_balasan_chat.findFirst({
                where: { platform_msg_id: platformMsgId },
              });
              if (existingGroupReply) {
                console.log(`[WhatsApp Akun ${akunId}] Group outgoing reply already saved (platform_msg_id: ${platformMsgId}), skipping duplicate.`);
                emitWhatsappEvent(akunId, "chat_update", { type: "message_create", fromMe: true, contactId });
                return;
              }
            }

            await prisma.$transaction([
              prisma.c_balasan_chat.create({
                data: {
                  chat_id: groupThread.id,
                  isi_balasan: msg.body,
                  dikirim_oleh: dikirimOleh,
                  berhasil: true,
                  platform_msg_id: platformMsgId,
                  dibuat_pada: msgTime,
                },
              }),
              prisma.m_chat.update({
                where: { id: groupThread.id },
                data: {
                  sudah_dibaca: isFromMe ? true : false,
                  status: isFromMe ? "dijawab" : "baru",
                },
              }),
            ]);
            console.log(`[WhatsApp Akun ${akunId}] Group msg appended to thread ${groupThread.id} by ${dikirimOleh}`);
          }
        } else {
          // ── Individual (1-on-1) chat ──
          if (!isFromMe) {
            // Incoming message: Save to m_chat
            await prisma.m_chat.create({
              data: {
                akun_id: akunId,
                sender_id: contactId,
                sender_nama: chatName,
                pesan: msg.body,
                sudah_dibaca: false,
                status: "baru",
                platform_msg_id: platformMsgId,
                dibuat_pada: msgTime,
              },
            });
            console.log(`[WhatsApp Akun ${akunId}] Realtime incoming message stored.`);
          } else {
            // Outgoing message: first check if already saved by balas/route.ts to avoid duplicate
            const existingReply = await prisma.c_balasan_chat.findFirst({
              where: { platform_msg_id: platformMsgId },
            });
            if (existingReply) {
              // Already saved by API route — skip duplicate, just emit event for UI update
              console.log(`[WhatsApp Akun ${akunId}] Outgoing reply already saved (platform_msg_id: ${platformMsgId}), skipping duplicate.`);
              emitWhatsappEvent(akunId, "chat_update", { type: "message_create", fromMe: true, contactId });
              return;
            }

            // Not found → message was sent directly from phone, save it
            const parentChat = await prisma.m_chat.findFirst({
              where: {
                akun_id: akunId,
                sender_id: contactId,
                dihapus_pada: null,
              },
              orderBy: { dibuat_pada: "desc" },
            });

            if (parentChat) {
              await prisma.$transaction([
                prisma.c_balasan_chat.create({
                  data: {
                    chat_id: parentChat.id,
                    isi_balasan: msg.body,
                    dikirim_oleh: "admin",
                    berhasil: true,
                    platform_msg_id: platformMsgId,
                    dibuat_pada: msgTime,
                  },
                }),
                prisma.m_chat.update({
                  where: { id: parentChat.id },
                  data: { status: "dijawab", sudah_dibaca: true },
                }),
              ]);
              console.log(`[WhatsApp Akun ${akunId}] Phone outgoing reply stored for thread ID: ${parentChat.id}`);
            }
          }
        }
        // Emit real-time event to notify SSE active connections
        emitWhatsappEvent(akunId, "chat_update", {
          type: "message_create",
          fromMe: isFromMe,
          contactId,
        });
      } catch (err) {
        console.error(`[WhatsApp Akun ${akunId}] Error in message_create event handler:`, err);
      }
    });


    client.on("auth_failure", async (msg) => {
      clientInfo.status = "disconnected";
      clientInfo.qrCode = null;
      clientInfo.error = msg || "Authentication failed";
      console.error(`[WhatsApp Akun ${akunId}] Auth Failure:`, msg);
      try {
        await prisma.m_akun_sosmed.update({
          where: { id: akunId },
          data: { status: "gagal_koneksi" },
        });
      } catch (dbErr) {
        console.error("Failed to update WhatsApp status in DB on auth failure:", dbErr);
      }
    });

    client.on("disconnected", async (reason) => {
      clientInfo.status = "disconnected";
      clientInfo.qrCode = null;
      clientInfo.error = reason || "Client disconnected";
      console.log(`[WhatsApp Akun ${akunId}] Client disconnected:`, reason);

      // Update status to terputus in DB
      try {
        await prisma.m_akun_sosmed.update({
          where: { id: akunId },
          data: { status: "terputus" },
        });
      } catch (dbErr) {
        console.error("Failed to update WhatsApp status in DB on disconnect:", dbErr);
      }
    });

    client.initialize().catch(async (err) => {
      clientInfo.status = "disconnected";
      clientInfo.qrCode = null;
      clientInfo.error = err?.message || "Initialization error";
      console.error(`[WhatsApp Akun ${akunId}] Initialization error:`, err);
      try {
        await prisma.m_akun_sosmed.update({
          where: { id: akunId },
          data: { status: "gagal_koneksi" },
        });
      } catch (dbErr) {
        console.error("Failed to update WhatsApp status in DB on init error:", dbErr);
      }
    });

    clientInfo.client = client;
  } catch (err: any) {
    clientInfo.status = "disconnected";
    clientInfo.qrCode = null;
    clientInfo.error = err?.message || "Failed to instantiate client";
    console.error(`[WhatsApp Akun ${akunId}] Failed to initialize:`, err);
  }

  return clientInfo;
}

/**
 * Logout client officially from device links, destroy instance, and wipe auth files from disk
 */
export async function logoutWhatsappClient(akunId: number): Promise<void> {
  const clientInfo = whatsappClients[akunId];
  if (clientInfo) {
    if (clientInfo.client) {
      try {
        if (clientInfo.status === "connected") {
          console.log(`[WhatsApp Akun ${akunId}] Logging out client...`);
          await clientInfo.client.logout();
        }
      } catch (logoutErr) {
        console.error(`[WhatsApp Akun ${akunId}] Error during client.logout():`, logoutErr);
      }

      try {
        console.log(`[WhatsApp Akun ${akunId}] Destroying client...`);
        await clientInfo.client.destroy();
      } catch (destroyErr) {
        console.error(`[WhatsApp Akun ${akunId}] Error during client.destroy():`, destroyErr);
      }
    }
    delete whatsappClients[akunId];
  }

  // Remove session folder from disk
  const fs = require("fs");
  const path = require("path");
  const sessionPath = path.join(process.cwd(), ".wwebjs_auth", `session-whatsapp-akun-${akunId}`);
  try {
    if (fs.existsSync(sessionPath)) {
      console.log(`[WhatsApp Akun ${akunId}] Deleting session directory: ${sessionPath}`);
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }
  } catch (fsErr) {
    console.error(`[WhatsApp Akun ${akunId}] Failed to delete session folder:`, fsErr);
  }
}

/**
 * Fetch and sync chats/messages from connected WhatsApp Web client to PostgreSQL DB.
 */
export async function syncWhatsappData(akunId: number): Promise<{ chats: number }> {
  const clientInfo = getWhatsappClient(akunId);
  if (!clientInfo) {
    throw new Error("WhatsApp client registry info is missing");
  }
  if (clientInfo.status !== "connected") {
    throw new Error(`WhatsApp client status is "${clientInfo.status}", expected "connected"`);
  }

  const client = clientInfo.client;
  if (!client) {
    throw new Error("WhatsApp client object instance is null or undefined in memory registry");
  }

  if (typeof client.getChats !== "function") {
    throw new Error("WhatsApp client.getChats is not a function (client instance might be invalid)");
  }

  const chats = await client.getChats();
  let syncedChats = 0;

  // Let's process the top 20 active chats to avoid hitting limit/slowness
  const activeChats = chats.slice(0, 20);

  for (const chat of activeChats) {
    // Only sync individual chats or groups that have messages
    if (!chat.id || (!chat.name && !chat.id.user)) continue;

    const senderName = chat.name || chat.id.user;
    const senderId = chat.id._serialized;

    // Fetch the last 20 messages in this thread
    const messages = await chat.fetchMessages({ limit: 20 });

    for (const msg of messages) {
      if (!msg.body) continue;

      const platformMsgId = msg.id.id;
      const isFromMe = msg.fromMe;
      const msgTime = new Date(msg.timestamp * 1000);

      // Find if we already stored this message thread
      if (!isFromMe) {
        const existingChat = await prisma.m_chat.findFirst({
          where: {
            akun_id: akunId,
            platform_msg_id: platformMsgId,
          },
        });

        if (!existingChat) {
          await prisma.m_chat.create({
            data: {
              akun_id: akunId,
              sender_id: senderId,
              sender_nama: senderName,
              pesan: msg.body,
              sudah_dibaca: true, // Mark read since it's history
              status: "dijawab", // We will determine this based on replies later
              platform_msg_id: platformMsgId,
              dibuat_pada: msgTime,
            },
          });
          syncedChats++;
        }
      } else {
        const parentChat = await prisma.m_chat.findFirst({
          where: {
            akun_id: akunId,
            sender_id: senderId,
            dibuat_pada: {
              lt: msgTime,
            },
          },
          orderBy: {
            dibuat_pada: "desc",
          },
        });

        if (parentChat) {
          const existingReply = await prisma.c_balasan_chat.findFirst({
            where: {
              chat_id: parentChat.id,
              isi_balasan: msg.body,
              dibuat_pada: msgTime,
            },
          });

          if (!existingReply) {
            await prisma.c_balasan_chat.create({
              data: {
                chat_id: parentChat.id,
                isi_balasan: msg.body,
                dikirim_oleh: "admin",
                berhasil: true,
                platform_msg_id: platformMsgId,
                dibuat_pada: msgTime,
              },
            });
            
            await prisma.m_chat.update({
              where: { id: parentChat.id },
              data: { status: "dijawab" },
            });
          }
        }
      }
    }
  }

  return { chats: syncedChats };
}

/**
 * Send WhatsApp message to a JID or specific number
 */
export async function sendWhatsappMessage(akunId: number, target: string, pesan: string): Promise<string> {
  const clientInfo = getWhatsappClient(akunId);
  if (!clientInfo.client || clientInfo.status !== "connected") {
    throw new Error("WhatsApp client is not connected");
  }

  let targetId = target;
  if (!targetId.includes("@")) {
    const cleanNumber = targetId.replace(/[^\d]/g, "");
    if (!cleanNumber) {
      throw new Error("Invalid phone number format");
    }
    targetId = `${cleanNumber}@c.us`;
  }
  
  const sentMsg = await clientInfo.client.sendMessage(targetId, pesan);
  return sentMsg.id.id; // Return platform message ID for deduplication
}

/**
 * Send WhatsApp media (image/file/document) to a JID or specific number via base64
 */
export async function sendWhatsappMedia(
  akunId: number,
  target: string,
  base64Data: string,
  mimeType: string,
  filename: string,
  caption?: string
): Promise<string> {
  const clientInfo = getWhatsappClient(akunId);
  if (!clientInfo.client || clientInfo.status !== "connected") {
    throw new Error("WhatsApp client is not connected");
  }

  let targetId = target;
  if (!targetId.includes("@")) {
    const cleanNumber = targetId.replace(/[^\d]/g, "");
    if (!cleanNumber) {
      throw new Error("Invalid phone number format");
    }
    targetId = `${cleanNumber}@c.us`;
  }

  const media = new MessageMedia(mimeType, base64Data, filename);
  const sentMsg = await clientInfo.client.sendMessage(targetId, media, {
    caption: caption || undefined,
  });
  return sentMsg.id.id; // Return platform message ID for deduplication
}

/**
 * Delete / unsend a WhatsApp message
 */
export async function deleteWhatsappMessage(
  akunId: number,
  senderId: string,
  platformMsgId: string
): Promise<boolean> {
  const clientInfo = getWhatsappClient(akunId);
  if (!clientInfo.client || clientInfo.status !== "connected") {
    throw new Error("WhatsApp client is not connected");
  }
  
  const chat = await clientInfo.client.getChatById(senderId);
  if (!chat) {
    throw new Error("Chat not found on WhatsApp device");
  }
  
  const messages = await chat.fetchMessages({ limit: 100 });
  const message = messages.find((m) => m.id.id === platformMsgId);
  if (!message) {
    throw new Error("Message not found on WhatsApp device");
  }
  
  await message.delete(true); // deletes for everyone (unsend)
  return true;
}

/**
 * Clear chat messages on WhatsApp device
 */
export async function clearWhatsappChat(akunId: number, senderId: string): Promise<boolean> {
  const clientInfo = getWhatsappClient(akunId);
  if (!clientInfo.client || clientInfo.status !== "connected") {
    throw new Error("WhatsApp client is not connected");
  }
  
  const chat = await clientInfo.client.getChatById(senderId);
  if (!chat) {
    throw new Error("Chat not found on WhatsApp device");
  }
  
  await chat.clearMessages();
  return true;
}


/**
 * Check and send pending/scheduled WhatsApp blast campaigns
 */
export async function checkAndSendScheduledBlasts() {
  try {
    const now = new Date();
    const pendingCampaigns = await prisma.m_blazzing_wa.findMany({
      where: {
        status: { in: ["pending", "processing"] },
        dihapus_pada: null,
        OR: [
          { tipe: "instant" },
          {
            tipe: "scheduled",
            dijadwalkan_pada: {
              lte: now,
            },
          },
        ],
      },
      include: {
        penerima: {
          where: {
            status: "pending",
            dihapus_pada: null,
          },
        },
      },
    });

    for (const campaign of pendingCampaigns) {
      if (campaign.penerima.length === 0) {
        await prisma.m_blazzing_wa.update({
          where: { id: campaign.id },
          data: { status: "sent" },
        });
        continue;
      }

      const clientInfo = getWhatsappClient(campaign.akun_id);
      if (!clientInfo.client || clientInfo.status !== "connected") {
        console.log(`[WhatsApp Blazzing] Client ${campaign.akun_id} not connected, skipping campaign ${campaign.id}`);
        continue;
      }

      await prisma.m_blazzing_wa.update({
        where: { id: campaign.id },
        data: { status: "processing" },
      });

      console.log(`[WhatsApp Blazzing] Processing campaign "${campaign.nama_kempen}" (${campaign.penerima.length} recipients)`);

      for (const receiver of campaign.penerima) {
        try {
          let formattedMessage = campaign.pesan
            .replace(/{nama}/gi, receiver.nama || "")
            .replace(/{nomor}/gi, receiver.nomor_telp || "");
          
          if (receiver.kontak_id) {
            const kontak = await prisma.m_kontak_wa.findUnique({
              where: { id: receiver.kontak_id },
            });
            if (kontak) {
              formattedMessage = formattedMessage
                .replace(/{email}/gi, kontak.email || "")
                .replace(/{perusahaan}/gi, kontak.perusahaan || "")
                .replace(/{jabatan}/gi, kontak.jabatan || "")
                .replace(/{catatan}/gi, kontak.catatan || "");
            }
          } else {
            formattedMessage = formattedMessage
              .replace(/{email}/gi, "")
              .replace(/{perusahaan}/gi, "")
              .replace(/{jabatan}/gi, "")
              .replace(/{catatan}/gi, "");
          }

          await sendWhatsappMessage(campaign.akun_id, receiver.nomor_telp, formattedMessage);

          await prisma.c_blazzing_penerima.update({
            where: { id: receiver.id },
            data: {
              status: "sent",
              dikirim_pada: new Date(),
              pesan_terformat: formattedMessage,
            },
          });
        } catch (err: any) {
          console.error(`[WhatsApp Blazzing] Failed to send message to ${receiver.nomor_telp}:`, err);
          await prisma.c_blazzing_penerima.update({
            where: { id: receiver.id },
            data: {
              status: "failed",
              pesan_error: err.message || "Failed to send message",
            },
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      const remaining = await prisma.c_blazzing_penerima.count({
        where: {
          blazzing_id: campaign.id,
          status: "pending",
          dihapus_pada: null,
        },
      });

      if (remaining === 0) {
        const failedCount = await prisma.c_blazzing_penerima.count({
          where: {
            blazzing_id: campaign.id,
            status: "failed",
            dihapus_pada: null,
          },
        });

        await prisma.m_blazzing_wa.update({
          where: { id: campaign.id },
          data: {
            status: failedCount > 0 ? "failed" : "sent",
          },
        });
      }
    }
  } catch (error) {
    console.error("[WhatsApp Blazzing Worker] Error:", error);
  }
}

// Start the background schedule worker if running in Node.js server env
if (typeof window === "undefined") {
  const globalForWorker = globalThis as unknown as {
    whatsappWorkerInterval: NodeJS.Timeout | undefined;
  };
  
  if (!globalForWorker.whatsappWorkerInterval) {
    console.log("[WhatsApp Blazzing Worker] Initializing background task worker...");
    globalForWorker.whatsappWorkerInterval = setInterval(() => {
      checkAndSendScheduledBlasts();
    }, 20000);
  }
}
