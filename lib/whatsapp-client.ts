import { Client, LocalAuth } from "whatsapp-web.js";
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
};

if (!globalForWhatsapp.whatsappClients) {
  globalForWhatsapp.whatsappClients = {};
}

export const whatsappClients = globalForWhatsapp.whatsappClients;

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

    client.on("auth_failure", (msg) => {
      clientInfo.status = "disconnected";
      clientInfo.qrCode = null;
      clientInfo.error = msg || "Authentication failed";
      console.error(`[WhatsApp Akun ${akunId}] Auth Failure:`, msg);
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

    client.initialize().catch((err) => {
      clientInfo.status = "disconnected";
      clientInfo.qrCode = null;
      clientInfo.error = err?.message || "Initialization error";
      console.error(`[WhatsApp Akun ${akunId}] Initialization error:`, err);
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
 * Fetch and sync chats/messages from connected WhatsApp Web client to PostgreSQL DB.
 */
export async function syncWhatsappData(akunId: number): Promise<{ chats: number }> {
  const clientInfo = getWhatsappClient(akunId);
  if (clientInfo.status !== "connected" || !clientInfo.client) {
    throw new Error("WhatsApp client is not connected");
  }

  const client = clientInfo.client;
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
      // We group chats by the external user's sender_id.
      // So individual messages received go into m_chat, replies sent by admin go to c_balasan_chat.
      if (!isFromMe) {
        // Message received: save as a chat message if not already saved
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
        // Message sent by me: this acts as an admin reply to the contact's chat thread.
        // First, check if we have a parent message received from this contact.
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
          // Check if this reply is already stored
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
                dibuat_pada: msgTime,
              },
            });
            
            // Mark the parent chat status as dijawab
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
