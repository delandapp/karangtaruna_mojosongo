"use client";

import { useState } from "react";
import {
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Terminal,
  Key,
  Shield,
  Copy,
  Check,
  Lightbulb,
  AlertTriangle,
  LogIn,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Step {
  title: string;
  description: string;
  code?: string;
  link?: { url: string; label: string };
  warning?: string;
  tip?: string;
}

interface PlatformGuideData {
  title: string;
  subtitle: string;
  library: { name: string; url: string; description: string };
  steps: Step[];
  importantNotes: string[];
}

// ─── Platform Guide Data ────────────────────────────────────────────────

const platformGuides: Record<string, PlatformGuideData> = {
  whatsapp: {
    title: "Panduan Koneksi WhatsApp",
    subtitle:
      "Gunakan library whatsapp-web.js untuk menghubungkan WhatsApp melalui scan QR Code",
    library: {
      name: "whatsapp-web.js",
      url: "https://github.com/pedroslopez/whatsapp-web.js",
      description:
        "Library Node.js yang memungkinkan interaksi dengan WhatsApp Web secara programatis melalui scan QR Code.",
    },
    steps: [
      {
        title: "Install library whatsapp-web.js di server",
        description:
          "Install library di backend/server Node.js Anda. Library ini mensimulasikan WhatsApp Web.",
        code: "npm install whatsapp-web.js qrcode-terminal",
      },
      {
        title: "Buat script untuk generate QR Code",
        description:
          "Buat file server yang akan men-generate QR code untuk di-scan menggunakan WhatsApp di ponsel Anda.",
        code: `const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true }
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('Scan QR code di atas dengan WhatsApp');
});

client.on('ready', () => {
  console.log('WhatsApp Client siap!');
  // Simpan session ID sebagai access_token
});

client.initialize();`,
      },
      {
        title: "Scan QR Code",
        description:
          'Buka WhatsApp di ponsel → Ketuk ikon titik tiga (⋮) → "Perangkat Tertaut" → "Tautkan Perangkat" → Scan QR code yang muncul di terminal.',
        tip: "QR code hanya berlaku ±20 detik. Jika expired, QR baru akan otomatis di-generate.",
      },
      {
        title: "Salin Session ID sebagai Access Token",
        description:
          "Setelah berhasil terkoneksi, session ID dari LocalAuth akan menjadi identifier sesi. Masukkan session ID ke field Access Token di form koneksi.",
        tip: "WhatsApp Web tidak memiliki username/password — semuanya melalui QR Code.",
      },
    ],
    importantNotes: [
      "WhatsApp Web hanya mendukung satu sesi per nomor telepon.",
      "Pastikan ponsel tetap terhubung ke internet agar sesi tetap aktif.",
      "Library ini bukan API resmi WhatsApp — gunakan untuk kebutuhan internal saja.",
      "Untuk penggunaan bisnis resmi, pertimbangkan WhatsApp Business API dari Meta.",
    ],
  },

  facebook: {
    title: "Panduan Koneksi Facebook",
    subtitle:
      "Cukup masukkan email/nomor telepon dan password Facebook Anda untuk menghubungkan akun",
    library: {
      name: "facebook-chat-api",
      url: "https://github.com/Schmavery/facebook-chat-api",
      description:
        "Library Node.js unofficial yang memungkinkan login ke Facebook menggunakan email dan password, tanpa perlu membuat App di Facebook Developer.",
    },
    steps: [
      {
        title: "Install library di server backend",
        description:
          "Install library facebook-chat-api di server Node.js Anda.",
        code: "npm install facebook-chat-api",
      },
      {
        title: "Masukkan Email dan Password di Form",
        description:
          'Klik tombol "Hubungkan Akun" di atas, lalu isi form:\n\n• Nama Tampilan → Nama halaman/akun Facebook Anda\n• Email/No. Telepon → Email atau nomor telepon akun Facebook\n• Password → Password akun Facebook Anda',
        tip: "Password Anda akan disimpan secara terenkripsi di server untuk keperluan koneksi otomatis.",
      },
      {
        title: "Sistem akan login otomatis",
        description:
          "Server backend akan menggunakan kredensial Anda untuk login ke Facebook dan menyimpan session cookies secara otomatis.",
        code: `// Contoh penggunaan di server:
const login = require('facebook-chat-api');

login({
  email: 'email@anda.com', 
  password: 'password_anda'
}, (err, api) => {
  if (err) return console.error(err);
  
  // Berhasil login! Simpan appState untuk sesi berikutnya
  const appState = api.getAppState();
  fs.writeFileSync('session.json', JSON.stringify(appState));
  
  console.log('Facebook berhasil terhubung!');
});`,
      },
    ],
    importantNotes: [
      "Gunakan App Password atau password khusus jika akun memiliki 2FA (Two-Factor Authentication).",
      "Facebook bisa mendeteksi login dari lokasi baru — setujui notifikasi keamanan jika diminta.",
      "Library ini bersifat unofficial — tidak dijamin kompatibilitas jangka panjang.",
      "Pastikan koneksi server aman (HTTPS) untuk melindungi kredensial Anda.",
    ],
  },

  instagram: {
    title: "Panduan Koneksi Instagram",
    subtitle:
      "Cukup masukkan username dan password Instagram Anda — tanpa perlu setup Facebook Developer",
    library: {
      name: "instagram-private-api",
      url: "https://github.com/dilame/instagram-private-api",
      description:
        "Library Node.js yang mensimulasikan aplikasi Instagram resmi, memungkinkan login langsung dengan username dan password.",
    },
    steps: [
      {
        title: "Install library di server backend",
        description:
          "Install library instagram-private-api di server Node.js Anda.",
        code: "npm install instagram-private-api",
      },
      {
        title: "Masukkan Username dan Password di Form",
        description:
          'Klik tombol "Hubungkan Akun" di atas, lalu isi form:\n\n• Nama Tampilan → Nama profil Instagram Anda\n• Username → Username Instagram (tanpa @)\n• Password → Password akun Instagram Anda',
        tip: "Gunakan username yang sama persis seperti di profil Instagram Anda.",
      },
      {
        title: "Sistem akan login otomatis",
        description:
          "Server backend akan login ke Instagram menggunakan kredensial Anda dan menyimpan session untuk akses berkelanjutan.",
        code: `// Contoh penggunaan di server:
const { IgApiClient } = require('instagram-private-api');

const ig = new IgApiClient();
ig.state.generateDevice('username_anda');

const auth = await ig.account.login('username_anda', 'password_anda');
console.log('Instagram berhasil terhubung!');
console.log('User ID:', auth.pk);

// Simpan session untuk penggunaan berikutnya
const serialized = await ig.state.serialize();
fs.writeFileSync('ig-session.json', JSON.stringify(serialized));`,
      },
    ],
    importantNotes: [
      "Jika akun memiliki 2FA, Anda perlu memasukkan kode verifikasi saat pertama kali login.",
      "Instagram bisa mendeteksi login mencurigakan — setujui melalui email/SMS jika diminta.",
      "Tidak perlu mengubah akun ke Business/Creator — akun Personal juga bisa digunakan.",
      "Library ini bersifat unofficial — menggunakan API internal Instagram.",
    ],
  },

  twitter: {
    title: "Panduan Koneksi Twitter / X",
    subtitle:
      "Cukup masukkan username dan password Twitter/X Anda untuk menghubungkan akun",
    library: {
      name: "agent-twitter-client",
      url: "https://github.com/ai16z/agent-twitter-client",
      description:
        "Library Node.js untuk berinteraksi dengan Twitter/X menggunakan login username dan password, tanpa perlu API key dari Developer Portal.",
    },
    steps: [
      {
        title: "Install library di server backend",
        description:
          "Install library agent-twitter-client di server Node.js Anda.",
        code: "npm install agent-twitter-client",
      },
      {
        title: "Masukkan Username dan Password di Form",
        description:
          'Klik tombol "Hubungkan Akun" di atas, lalu isi form:\n\n• Nama Tampilan → Nama profil Twitter/X Anda\n• Username → Username Twitter tanpa @ (contoh: kt_mojosongo)\n• Password → Password akun Twitter/X Anda',
        tip: "Gunakan username tanpa tanda @.",
      },
      {
        title: "Sistem akan login otomatis",
        description:
          "Server backend akan login ke Twitter/X dan menyimpan session cookies untuk akses berkelanjutan.",
        code: `// Contoh penggunaan di server:
const { Scraper } = require('agent-twitter-client');

const scraper = new Scraper();
await scraper.login('username', 'password');

if (await scraper.isLoggedIn()) {
  console.log('Twitter/X berhasil terhubung!');
  
  // Simpan cookies untuk sesi berikutnya
  const cookies = await scraper.getCookies();
  fs.writeFileSync('twitter-cookies.json', JSON.stringify(cookies));
}`,
      },
    ],
    importantNotes: [
      "Jika akun menggunakan 2FA, Anda mungkin perlu memasukkan kode verifikasi.",
      "Twitter/X bisa membatasi akun yang terdeteksi login dari bot — gunakan dengan bijak.",
      "Library ini tidak memerlukan Twitter API Key atau Developer Account.",
      "Rate limit tetap berlaku — hindari terlalu banyak request dalam waktu singkat.",
    ],
  },

  tiktok: {
    title: "Panduan Koneksi TikTok",
    subtitle:
      "Cukup masukkan username dan password TikTok Anda untuk menghubungkan akun",
    library: {
      name: "tiktok-scraper",
      url: "https://github.com/drawrowfly/tiktok-scraper",
      description:
        "Library Node.js untuk mengakses data TikTok. Dikombinasikan dengan Puppeteer untuk login otomatis menggunakan username dan password.",
    },
    steps: [
      {
        title: "Install library di server backend",
        description:
          "Install library tiktok-scraper dan Puppeteer di server Node.js Anda untuk login otomatis.",
        code: "npm install tiktok-scraper puppeteer",
      },
      {
        title: "Masukkan Username dan Password di Form",
        description:
          'Klik tombol "Hubungkan Akun" di atas, lalu isi form:\n\n• Nama Tampilan → Nama profil TikTok Anda\n• Username → Username TikTok (dengan atau tanpa @)\n• Password → Password akun TikTok Anda',
        tip: "Jika biasanya login via Google/Facebook, buat password khusus TikTok terlebih dahulu di Settings → Manage Account → Password.",
      },
      {
        title: "Sistem akan login otomatis",
        description:
          "Server backend akan login ke TikTok menggunakan Puppeteer (headless browser) dan menyimpan session cookies.",
        code: `// Contoh penggunaan di server:
const puppeteer = require('puppeteer');

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

await page.goto('https://www.tiktok.com/login/phone-or-email/email');
await page.type('input[name="username"]', 'username_anda');
await page.type('input[type="password"]', 'password_anda');
await page.click('button[type="submit"]');

// Tunggu login berhasil
await page.waitForNavigation();
console.log('TikTok berhasil terhubung!');

// Simpan cookies untuk sesi berikutnya
const cookies = await page.cookies();
fs.writeFileSync('tiktok-cookies.json', JSON.stringify(cookies));
await browser.close();`,
      },
    ],
    importantNotes: [
      "Jika biasanya login via Google/Apple, set password TikTok dulu di Settings → Manage Account.",
      "TikTok bisa meminta CAPTCHA saat login — server perlu menangani ini.",
      "Login via Puppeteer membutuhkan resource server lebih besar (headless browser).",
      "Cookies session TikTok bisa expired — sistem akan otomatis re-login jika diperlukan.",
    ],
  },
};

// ─── Sub-Components ─────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-zinc-400 hover:text-zinc-200"
      title="Salin kode"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}

function StepCard({
  step,
  index,
  accentColor,
}: {
  step: Step;
  index: number;
  accentColor: string;
}) {
  return (
    <div className="relative flex gap-4">
      {/* Step number circle */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`flex items-center justify-center size-8 rounded-full text-white text-sm font-bold shadow-lg ${accentColor}`}
        >
          {index + 1}
        </div>
        <div className="w-px flex-1 bg-border/50 mt-2" />
      </div>

      {/* Step content */}
      <div className="pb-8 flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-foreground mb-1.5">
          {step.title}
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3 whitespace-pre-line">
          {step.description}
        </p>

        {step.code && (
          <div className="relative rounded-lg bg-zinc-950 dark:bg-zinc-900/80 border border-zinc-800 overflow-hidden mb-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 dark:bg-zinc-800/50 border-b border-zinc-800">
              <Terminal className="size-3 text-zinc-500" />
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                Code
              </span>
            </div>
            <pre className="p-3 overflow-x-auto text-xs leading-relaxed font-mono text-zinc-300">
              <code>{step.code}</code>
            </pre>
            <CopyButton text={step.code} />
          </div>
        )}

        {step.link && (
          <a
            href={step.link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline underline-offset-2"
          >
            <ExternalLink className="size-3" />
            {step.link.label}
          </a>
        )}

        {step.warning && (
          <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
              {step.warning}
            </p>
          </div>
        )}

        {step.tip && (
          <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Lightbulb className="size-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
              {step.tip}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

interface PlatformGuideProps {
  platformSlug: string;
}

export function PlatformGuide({ platformSlug }: PlatformGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const guide = platformGuides[platformSlug.toLowerCase()];

  if (!guide) return null;

  const getAccentColor = () => {
    switch (platformSlug.toLowerCase()) {
      case "facebook":
        return "bg-blue-600";
      case "instagram":
        return "bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500";
      case "tiktok":
        return "bg-zinc-900 dark:bg-white dark:text-black";
      case "whatsapp":
        return "bg-emerald-600";
      case "twitter":
        return "bg-sky-500";
      default:
        return "bg-primary";
    }
  };

  const getAccentTextColor = () => {
    switch (platformSlug.toLowerCase()) {
      case "facebook":
        return "text-blue-600 dark:text-blue-400";
      case "instagram":
        return "text-pink-600 dark:text-pink-400";
      case "tiktok":
        return "text-rose-500 dark:text-rose-400";
      case "whatsapp":
        return "text-emerald-600 dark:text-emerald-400";
      case "twitter":
        return "text-sky-500 dark:text-sky-400";
      default:
        return "text-primary";
    }
  };

  const getBorderColor = () => {
    switch (platformSlug.toLowerCase()) {
      case "facebook":
        return "border-blue-500/20";
      case "instagram":
        return "border-pink-500/20";
      case "tiktok":
        return "border-zinc-500/20";
      case "whatsapp":
        return "border-emerald-500/20";
      case "twitter":
        return "border-sky-500/20";
      default:
        return "border-primary/20";
    }
  };

  const isCredential = ["facebook", "instagram", "tiktok", "twitter"].includes(
    platformSlug.toLowerCase()
  );

  const accentColor = getAccentColor();
  const accentTextColor = getAccentTextColor();
  const borderColor = getBorderColor();

  return (
    <Card
      className={`border ${borderColor} bg-card/60 backdrop-blur-sm shadow-xs rounded-2xl overflow-hidden transition-all duration-300`}
    >
      {/* Header — always visible */}
      <CardHeader
        className="p-6 cursor-pointer select-none hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center size-10 rounded-xl ${accentColor} shadow-lg`}
            >
              {isCredential ? (
                <LogIn className="size-5 text-white" />
              ) : (
                <BookOpen className="size-5 text-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                {guide.title}
                {isCredential ? (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 text-[10px] font-medium rounded-full">
                    Login Mudah
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-background/80 text-[10px] font-medium"
                  >
                    QR Code
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-lg leading-relaxed">
                {guide.subtitle}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="size-8 p-0 shrink-0">
            {isExpanded ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {/* Expandable Content */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <CardContent className="px-6 pb-6 pt-0 space-y-6">
          {/* Quick Summary for credential-based platforms */}
          {isCredential && (
            <div
              className={`flex items-start gap-3 p-4 rounded-xl border-2 ${borderColor} bg-gradient-to-br from-emerald-500/5 to-emerald-500/0`}
            >
              <LogIn
                className={`size-5 shrink-0 mt-0.5 ${accentTextColor}`}
              />
              <div className="min-w-0">
                <span className="text-sm font-semibold text-foreground">
                  Cara Cepat
                </span>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Klik tombol{" "}
                  <span className="font-semibold text-foreground">
                    &quot;Hubungkan Akun&quot;
                  </span>{" "}
                  di bagian atas halaman, lalu masukkan username dan password Anda.
                  Sistem akan login dan menyimpan sesi secara otomatis. Tidak
                  perlu setup API, developer portal, atau OAuth.
                </p>
              </div>
            </div>
          )}

          {/* Library Info */}
          <div
            className={`flex items-start gap-3 p-4 rounded-xl border ${borderColor} bg-muted/20`}
          >
            <Shield className={`size-5 shrink-0 mt-0.5 ${accentTextColor}`} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">
                  {guide.library.name}
                </span>
                <a
                  href={guide.library.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 text-xs font-medium ${accentTextColor} hover:underline underline-offset-2`}
                >
                  <ExternalLink className="size-3" />
                  GitHub
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {guide.library.description}
              </p>
            </div>
          </div>

          {/* Steps */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Key className={`size-4 ${accentTextColor}`} />
              {isCredential
                ? "Langkah-langkah Login"
                : "Langkah-langkah Koneksi"}
            </h3>
            <div>
              {guide.steps.map((step, i) => (
                <StepCard
                  key={i}
                  step={step}
                  index={i}
                  accentColor={accentColor}
                />
              ))}
            </div>
          </div>

          {/* Important Notes */}
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
            <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle className="size-4" />
              Catatan Penting
            </h4>
            <ul className="space-y-1.5">
              {guide.importantNotes.map((note, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400/80 leading-relaxed"
                >
                  <span className="mt-1 size-1 rounded-full bg-amber-500 shrink-0" />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
