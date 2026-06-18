import { IgApiClient } from "instagram-private-api";
import { prisma } from "@/lib/prisma";

/**
 * Authenticate IgApiClient using a browser sessionid cookie.
 * This is the most reliable method — the user copies their sessionid from browser DevTools.
 */
export async function authenticateWithCookie(
  username: string,
  cookieInput: string
): Promise<{ client: IgApiClient; serializedState: string }> {
  const ig = new IgApiClient();
  ig.state.generateDevice(username);

  console.log(`[Instagram] Authenticating ${username} via cookie...`);

  const trimmedInput = cookieInput.trim();

  if (trimmedInput.includes("=") || trimmedInput.includes(";")) {
    console.log(`[Instagram] Processing full cookie string...`);
    // Split cookie string by semicolon and inject each cookie
    const cookies = trimmedInput.split(";");
    for (const cookie of cookies) {
      const trimmedCookie = cookie.trim();
      if (!trimmedCookie) continue;
      
      const eqIdx = trimmedCookie.indexOf("=");
      if (eqIdx === -1) continue;
      
      const name = trimmedCookie.substring(0, eqIdx).trim();
      const value = trimmedCookie.substring(eqIdx + 1).trim();
      
      // Build a proper cookie string for the cookie jar
      const cookieStr = `${name}=${value}; Domain=.instagram.com; Path=/; Secure; HttpOnly`;
      try {
        await ig.state.cookieJar.setCookie(cookieStr, "https://www.instagram.com");
      } catch (e: any) {
        console.warn(`[Instagram] Failed to set cookie ${name}:`, e.message);
      }
    }
  } else {
    console.log(`[Instagram] Processing single sessionid...`);
    const decodedSessionId = decodeURIComponent(trimmedInput);
    const cookieStr = `sessionid=${decodedSessionId}; Domain=.instagram.com; Path=/; Secure; HttpOnly`;
    await ig.state.cookieJar.setCookie(cookieStr, "https://www.instagram.com");

    // Extract user ID from sessionid cookie (it is the prefix before the first ':') and set ds_user_id cookie
    const userIdMatch = decodedSessionId.match(/^(\d+):/);
    if (userIdMatch && userIdMatch[1]) {
      const userId = userIdMatch[1];
      console.log(`[Instagram] Extracted user ID ${userId} from sessionid. Setting ds_user_id cookie.`);
      const dsUserIdCookie = `ds_user_id=${userId}; Domain=.instagram.com; Path=/; Secure; HttpOnly`;
      await ig.state.cookieJar.setCookie(dsUserIdCookie, "https://www.instagram.com");
    }
  }

  // Verify the session is valid
  try {
    console.log(`[Instagram] Verifying cookie session for ${username}...`);
    const currentUser = await ig.account.currentUser();
    if (!currentUser || !currentUser.pk) {
      throw new Error("Sesi tidak valid. Silakan salin ulang sessionid dari browser Anda.");
    }
    console.log(`[Instagram] Cookie session verified for ${username} (pk: ${currentUser.pk}).`);
  } catch (err: any) {
    console.error(`[Instagram] Cookie session verification failed:`, err?.message || err);
    const errMsg = err?.message || "";
    
    if (
      errMsg.includes("checkpoint_required") || 
      errMsg.includes("checkpoint") ||
      errMsg.toLowerCase().includes("something went wrong")
    ) {
      throw new Error(
        "Instagram mendeteksi login baru dari server dan memblokirnya. " +
        "Silakan buka Instagram di HP/browser Anda -> masuk ke Pengaturan (Settings) -> Keamanan (Security) -> Aktivitas Login (Login Activity). " +
        "Cari percobaan login mencurigakan dari perangkat Xiaomi Redmi (atau sejenisnya) di lokasi Anda, lalu klik 'Ini Saya' / 'This was me'. " +
        "Setelah Anda menyetujuinya, coba klik tombol 'Login & Hubungkan' kembali di sini."
      );
    }
    
    if (errMsg.includes("login_required") || errMsg.includes("not authenticated")) {
      throw new Error(
        "Sessionid cookie tidak valid atau sudah kedaluwarsa. Silakan login ulang ke Instagram di browser dan salin sessionid yang baru."
      );
    }
    throw new Error(
      errMsg || "Sesi Instagram tidak valid. Pastikan sessionid yang Anda masukkan benar."
    );
  }

  const serialized = await ig.state.serialize();
  return { client: ig, serializedState: JSON.stringify(serialized) };
}

/**
 * Standard API login (may fail for Facebook-linked accounts).
 * Falls back to cookie auth if sessionId is provided.
 */
export async function authenticateInstagram(
  username: string,
  password?: string,
  sessionId?: string
): Promise<{ client: IgApiClient; serializedState: string }> {
  // If sessionId is provided, use cookie auth directly (most reliable)
  if (sessionId && sessionId.trim()) {
    return authenticateWithCookie(username, sessionId.trim());
  }

  if (!password) {
    throw new Error("Password atau Session ID Instagram wajib diisi.");
  }

  // Standard API login attempt
  const ig = new IgApiClient();
  ig.state.generateDevice(username);
  await ig.simulate.preLoginFlow();

  try {
    console.log(`[Instagram] Trying standard API login for ${username}...`);
    await ig.account.login(username, password);

    process.nextTick(async () => {
      try {
        await ig.simulate.postLoginFlow();
      } catch (e) {
        console.error("[Instagram] Post-login flow simulation failed:", e);
      }
    });

    const serialized = await ig.state.serialize();
    return { client: ig, serializedState: JSON.stringify(serialized) };
  } catch (loginError: any) {
    const errMsg = loginError?.message || "";
    const errName = loginError?.name || "";
    console.warn(`[Instagram] API login failed for ${username}: ${errMsg} (${errName})`);

    if (errMsg.includes("challenge") || errMsg.includes("checkpoint")) {
      throw loginError;
    }

    // Facebook-linked or bot-detection error — cannot proceed without sessionId
    if (
      errMsg.toLowerCase().includes("facebook") ||
      errMsg.toLowerCase().includes("log in with your linked") ||
      errName === "IgLoginBadPasswordError"
    ) {
      throw new Error(
        "Login otomatis tidak dapat dilakukan untuk akun ini. " +
          "Silakan gunakan metode Session ID Cookie: buka Instagram di browser, " +
          "tekan F12 → Application → Cookies → instagram.com, salin nilai 'sessionid', " +
          "lalu tempelkan di kolom 'Session ID' pada form hubungkan akun."
      );
    }

    throw loginError;
  }
}

/**
 * Get an active authenticated Instagram client for a saved account, reusing session if valid.
 */
export async function getInstagramClient(account: any): Promise<IgApiClient> {
  const ig = new IgApiClient();
  ig.state.generateDevice(account.username);

  // Try using serialized session state cached in refresh_token
  if (account.refresh_token) {
    try {
      console.log(`[Instagram] Loading cached session for ${account.username} from database...`);
      const savedState = JSON.parse(account.refresh_token);
      await ig.state.deserialize(savedState);

      // Verify that the session is still active
      await ig.account.currentUser();
      console.log(`[Instagram] Session is valid for ${account.username}.`);
      return ig;
    } catch (sessionError) {
      console.log(
        `[Instagram] Cached session expired or invalid for ${account.username}:`,
        sessionError
      );
    }
  }

  // Re-authenticate fresh if session is missing or expired
  // access_token stores the password or cookie
  const { client, serializedState } = await authenticateInstagram(
    account.username,
    account.access_token
  );

  // Cache the new session state in database
  console.log(
    `[Instagram] Updating cached session state in database for ${account.username}...`
  );
  await prisma.m_akun_sosmed.update({
    where: { id: account.id },
    data: {
      refresh_token: serializedState,
    },
  });

  return client;
}
