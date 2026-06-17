# PRD — Dashboard Sosial Media
# Aplikasi Karang Taruna — Fitur Baru
# Versi: 1.0.0 | Tanggal: 17 Juni 2026 | Status: Draft

---

## KONTEKS PROYEK

Ini adalah PRD (Product Requirements Document) untuk menambahkan fitur baru bernama **Dashboard Sosial Media** ke dalam aplikasi Karang Taruna yang sudah ada.

Fitur ini memungkinkan pengurus dan tim konten mengelola 5 platform sosial media dari satu dasbor terpusat, tanpa perlu berpindah-pindah aplikasi.

Platform yang didukung: TikTok, Facebook, Instagram, WhatsApp, Twitter.

---

## TECH STACK WAJIB

Semua implementasi HARUS mengikuti aturan berikut. Tidak boleh ada penyimpangan.

- Framework: Next.js (App Router)
- Bahasa: TypeScript (strict mode, dilarang pakai `any`)
- ORM Database: Prisma
- Validasi Form: Zod (wajib di semua form dan API handler)
- State Management & Data Fetching: Redux Toolkit + RTK Query
- Icons: React Icons (dilarang pakai emoji atau SVG inline)
- Komponen Dropdown/Select: Combobox (ikuti komponen yang sudah ada di project)
- CSS: Tailwind CSS (dilarang inline style)

---

## KONVENSI DATABASE (WAJIB DIIKUTI)

### Prefix Nama Tabel

- `m_namatabel` → tabel utama / master
- `c_namatabel` → tabel turunan (child), berelasi ke tabel master
- `r_namatabel` → tabel pivot (many-to-many relation)

### Field Audit Wajib di Setiap Model

Setiap model Prisma WAJIB memiliki 3 field berikut:

```
dibuat_pada      DateTime  @default(now())
diperbarui_pada  DateTime  @updatedAt
dihapus_pada     DateTime?   // Soft delete — jangan pernah pakai delete(), selalu set field ini
```

### Aturan Soft Delete

- DILARANG menggunakan `prisma.model.delete()`
- Gunakan `prisma.model.update({ data: { dihapus_pada: new Date() } })`
- Setiap query data aktif WAJIB filter: `where: { dihapus_pada: null }`

---

## SKEMA DATABASE PRISMA

### m_platform
Tabel master platform sosial media.

```prisma
model m_platform {
  id               Int       @id @default(autoincrement())
  nama             String    // tiktok | facebook | instagram | whatsapp | twitter
  slug             String    @unique
  ikon_url         String?
  aktif            Boolean   @default(true)
  dibuat_pada      DateTime  @default(now())
  diperbarui_pada  DateTime  @updatedAt
  dihapus_pada     DateTime?

  akun             m_akun_sosmed[]
}
```

### m_akun_sosmed
Tabel master akun sosial media yang sudah dihubungkan.

```prisma
model m_akun_sosmed {
  id               Int        @id @default(autoincrement())
  platform_id      Int
  nama_akun        String
  username         String
  access_token     String     @db.Text
  refresh_token    String?    @db.Text
  token_expires_at DateTime?
  status           String     @default("terhubung") // terhubung | terputus | expired
  dibuat_pada      DateTime   @default(now())
  diperbarui_pada  DateTime   @updatedAt
  dihapus_pada     DateTime?

  platform         m_platform    @relation(fields: [platform_id], references: [id])
  konten           m_konten[]
  chat             m_chat[]
}
```

### m_konten
Tabel master konten (postingan, story, reels, tweet).

```prisma
model m_konten {
  id               Int       @id @default(autoincrement())
  akun_id          Int
  judul            String?
  caption          String?   @db.Text
  tipe_konten      String    // post | story | reels | tweet
  status           String    @default("draft") // draft | scheduled | published | failed
  dijadwalkan_pada DateTime?
  diposting_pada   DateTime?
  dibuat_pada      DateTime  @default(now())
  diperbarui_pada  DateTime  @updatedAt
  dihapus_pada     DateTime?

  akun             m_akun_sosmed       @relation(fields: [akun_id], references: [id])
  media            c_media_konten[]
  jadwal           c_jadwal_konten[]
  platform         r_konten_platform[]
}
```

### c_media_konten
Tabel turunan — file media (gambar/video) yang terlampir pada konten.

```prisma
model c_media_konten {
  id               Int       @id @default(autoincrement())
  konten_id        Int
  url              String
  tipe_media       String    // image | video | document
  urutan           Int       @default(0)
  dibuat_pada      DateTime  @default(now())
  diperbarui_pada  DateTime  @updatedAt
  dihapus_pada     DateTime?

  konten           m_konten  @relation(fields: [konten_id], references: [id])
}
```

### c_jadwal_konten
Tabel turunan — detail jadwal posting konten.

```prisma
model c_jadwal_konten {
  id               Int       @id @default(autoincrement())
  konten_id        Int
  waktu_posting    DateTime
  status_job       String    @default("pending") // pending | running | done | failed
  pesan_error      String?   @db.Text
  dibuat_pada      DateTime  @default(now())
  diperbarui_pada  DateTime  @updatedAt
  dihapus_pada     DateTime?

  konten           m_konten  @relation(fields: [konten_id], references: [id])
}
```

### m_chat
Tabel master percakapan/pesan masuk dari semua platform.

```prisma
model m_chat {
  id               Int       @id @default(autoincrement())
  akun_id          Int
  sender_id        String    // ID pengirim dari platform
  sender_nama      String
  pesan            String    @db.Text
  sudah_dibaca     Boolean   @default(false)
  status           String    @default("baru") // baru | dijawab | diarsipkan
  platform_msg_id  String?   // ID pesan asli dari platform
  dibuat_pada      DateTime  @default(now())
  diperbarui_pada  DateTime  @updatedAt
  dihapus_pada     DateTime?

  akun             m_akun_sosmed    @relation(fields: [akun_id], references: [id])
  balasan          c_balasan_chat[]
}
```

### c_balasan_chat
Tabel turunan — balasan pesan chat.

```prisma
model c_balasan_chat {
  id               Int       @id @default(autoincrement())
  chat_id          Int
  isi_balasan      String    @db.Text
  dikirim_oleh     String    // user_id atau "system"
  berhasil         Boolean   @default(false)
  dibuat_pada      DateTime  @default(now())
  diperbarui_pada  DateTime  @updatedAt
  dihapus_pada     DateTime?

  chat             m_chat    @relation(fields: [chat_id], references: [id])
}
```

### m_analitik
Tabel master snapshot data analitik per akun per hari.

```prisma
model m_analitik {
  id               Int       @id @default(autoincrement())
  akun_id          Int
  tanggal          DateTime
  followers        Int       @default(0)
  reach            Int       @default(0)
  impressions      Int       @default(0)
  engagement       Int       @default(0)
  likes            Int       @default(0)
  komentar         Int       @default(0)
  share            Int       @default(0)
  dibuat_pada      DateTime  @default(now())
  diperbarui_pada  DateTime  @updatedAt
  dihapus_pada     DateTime?

  akun             m_akun_sosmed @relation(fields: [akun_id], references: [id])
}
```

### r_konten_platform
Tabel pivot — relasi konten ke platform (satu konten bisa diposting ke banyak platform).

```prisma
model r_konten_platform {
  id               Int       @id @default(autoincrement())
  konten_id        Int
  platform_id      Int
  external_post_id String?   // ID postingan di platform asli setelah berhasil diposting
  dibuat_pada      DateTime  @default(now())
  diperbarui_pada  DateTime  @updatedAt
  dihapus_pada     DateTime?

  konten           m_konten   @relation(fields: [konten_id], references: [id])
  platform         m_platform @relation(fields: [platform_id], references: [id])
}
```

---

## STRUKTUR FOLDER (WAJIB IKUTI ARSITEKTUR EXISTING)

Tambahkan folder-folder berikut mengikuti struktur yang sudah ada di project:

```
(sosial-media)/
├── facebook/
│   ├── analytic/        → page.tsx — Dashboard analitik Facebook
│   ├── chat/            → page.tsx — Inbox & kelola chat Facebook
│   ├── content/         → page.tsx — Buat & kelola postingan Facebook
│   └── login/           → page.tsx — Hubungkan/putuskan akun Facebook
├── instagram/
│   ├── analytic/
│   ├── chat/
│   ├── content/
│   └── login/
├── tiktok/
│   ├── analytic/
│   ├── chat/
│   ├── content/
│   └── login/
├── twitter/
│   ├── analytic/
│   ├── chat/
│   ├── content/
│   └── login/
└── whatsapp/
    ├── analytic/
    ├── chat/
    ├── content/
    └── login/
```

### Lokasi Komponen Wajib

```
/components/organisms/forms/
  FormKonten.tsx              → Form buat/edit konten (banyak field → page sendiri)
  FormJadwalKonten.tsx        → Form jadwal posting
  FormHubungkanAkun.tsx       → Form koneksi akun OAuth

/components/organisms/modals/sosial-media/
  konten/
    ModalKonfirmasiHapusKonten.tsx
    ModalPublishSekarang.tsx
  chat/
    ModalDetailPercakapan.tsx
    ModalBalasChat.tsx
  login/
    ModalPutuskanAkun.tsx
```

---

## ATURAN PENEMPATAN FORM & MODAL

- Form dengan SEDIKIT field (≤5 field) → gunakan MODAL, tulis di `/components/organisms/modals/sosial-media/`
- Form dengan BANYAK field (>5 field) → buat PAGE TERSENDIRI di folder platform masing-masing
- Semua form WAJIB validasi pakai Zod schema
- Semua dropdown/select WAJIB pakai komponen Combobox (ikuti contoh yang sudah ada)
- Semua ikon WAJIB dari React Icons

---

## IMPLEMENTASI RTK QUERY

File: `/features/api/sosialMediaApi.ts`

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const sosialMediaApi = createApi({
  reducerPath: 'sosialMediaApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/sosial-media' }),
  tagTypes: ['Platform', 'Akun', 'Konten', 'Chat', 'Analitik'],
  endpoints: (builder) => ({

    // Platform
    getDaftarPlatform: builder.query<Platform[], void>({
      query: () => '/platform',
      providesTags: ['Platform'],
    }),

    // Akun Sosial Media
    getAkunByPlatform: builder.query<AkunSosmed[], number>({
      query: (platformId) => `/akun?platform_id=${platformId}`,
      providesTags: ['Akun'],
    }),
    hubungkanAkun: builder.mutation<AkunSosmed, HubungkanAkunPayload>({
      query: (body) => ({ url: '/akun', method: 'POST', body }),
      invalidatesTags: ['Akun'],
    }),
    putuskanAkun: builder.mutation<void, number>({
      query: (id) => ({ url: `/akun/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Akun'],
    }),

    // Konten
    getDaftarKonten: builder.query<Konten[], KontenFilter>({
      query: (params) => ({ url: '/konten', params }),
      providesTags: ['Konten'],
    }),
    buatKonten: builder.mutation<Konten, BuatKontenPayload>({
      query: (body) => ({ url: '/konten', method: 'POST', body }),
      invalidatesTags: ['Konten'],
    }),
    updateKonten: builder.mutation<Konten, UpdateKontenPayload>({
      query: ({ id, ...body }) => ({ url: `/konten/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Konten'],
    }),
    hapusKonten: builder.mutation<void, number>({
      query: (id) => ({ url: `/konten/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Konten'],
    }),

    // Chat
    getDaftarChat: builder.query<Chat[], ChatFilter>({
      query: (params) => ({ url: '/chat', params }),
      providesTags: ['Chat'],
    }),
    balasChat: builder.mutation<void, BalasChatPayload>({
      query: (body) => ({ url: '/chat/balas', method: 'POST', body }),
      invalidatesTags: ['Chat'],
    }),

    // Analitik
    getAnalitik: builder.query<Analitik, AnalitikFilter>({
      query: (params) => ({ url: '/analitik', params }),
      providesTags: ['Analitik'],
    }),
  }),
});

export const {
  useGetDaftarPlatformQuery,
  useGetAkunByPlatformQuery,
  useHubungkanAkunMutation,
  usePutuskanAkunMutation,
  useGetDaftarKontenQuery,
  useBuatKontenMutation,
  useUpdateKontenMutation,
  useHapusKontenMutation,
  useGetDaftarChatQuery,
  useBalasaChatMutation,
  useGetAnalitikQuery,
} = sosialMediaApi;
```

---

## CONTOH ZOD SCHEMA VALIDASI

File: `/lib/validations/sosial-media.schema.ts`

```typescript
import { z } from 'zod';

export const schemaHubungkanAkun = z.object({
  platform_id: z.number({ required_error: 'Platform wajib dipilih' }),
  nama_akun:   z.string().min(1, 'Nama akun wajib diisi'),
  username:    z.string().min(1, 'Username wajib diisi'),
  access_token: z.string().min(1, 'Access token wajib diisi'),
  refresh_token: z.string().optional(),
  token_expires_at: z.string().datetime().optional(),
});

export const schemaBuatKonten = z.object({
  akun_id:     z.number({ required_error: 'Akun wajib dipilih' }),
  tipe_konten: z.enum(['post', 'story', 'reels', 'tweet']),
  caption:     z.string().min(1, 'Caption wajib diisi').max(2200),
  platform_ids: z.array(z.number()).min(1, 'Pilih minimal satu platform'),
  jadwal:      z.string().datetime().optional(), // kosong = publish sekarang
  media_urls:  z.array(z.string().url()).optional(),
});

export const schemaBalasChat = z.object({
  chat_id:     z.number({ required_error: 'Chat ID wajib ada' }),
  isi_balasan: z.string().min(1, 'Balasan tidak boleh kosong').max(1000),
});

export type FormHubungkanAkun = z.infer<typeof schemaHubungkanAkun>;
export type FormBuatKonten    = z.infer<typeof schemaBuatKonten>;
export type FormBalasChat     = z.infer<typeof schemaBalasChat>;
```

---

## FITUR PER MODUL

### Modul 1 — Login / Koneksi Akun (`/login`)

Tujuan: Menghubungkan akun platform sosial media ke aplikasi.

Fitur yang harus ada:
- Tampilkan daftar platform yang tersedia (data dari `m_platform`)
- Tampilkan status koneksi setiap akun (terhubung / terputus / expired)
- Tombol "Hubungkan" → redirect OAuth 2.0 ke masing-masing platform
- Tombol "Putuskan" → soft delete akun di `m_akun_sosmed`, set `dihapus_pada`
- Tombol "Perbarui Token" → refresh access token yang akan expired
- WhatsApp menggunakan WhatsApp Business Cloud API (bukan OAuth biasa)

Form: Sedikit field → gunakan MODAL (`ModalHubungkanAkun`)
Validasi: `schemaHubungkanAkun` dari Zod
RTK Query: `useHubungkanAkunMutation`, `usePutuskanAkunMutation`

---

### Modul 2 — Chat / Inbox (`/chat`)

Tujuan: Membaca dan membalas pesan dari semua platform dalam satu tampilan.

Fitur yang harus ada:
- Unified inbox — semua pesan dari semua platform tampil dalam satu halaman
- Filter berdasarkan: platform (Combobox) dan status (baru / dijawab / diarsipkan)
- Tampilkan badge jumlah pesan belum dibaca di sidebar
- Klik percakapan → buka riwayat pesan (bisa pakai modal atau panel samping)
- Form balas pesan inline — kirim via API platform asli
- Tandai sudah dibaca otomatis saat percakapan dibuka
- Search bar untuk mencari pesan

Form: Sedikit field → gunakan MODAL (`ModalBalasChat`)
Validasi: `schemaBalasChat` dari Zod
RTK Query: `useGetDaftarChatQuery`, `useBalasaChatMutation`
Polling interval: setiap 30 detik untuk update pesan baru

---

### Modul 3 — Content Management (`/content`)

Tujuan: Membuat, menjadwalkan, dan mengelola konten untuk semua platform.

Fitur yang harus ada:
- Daftar konten dengan tab: Semua | Draft | Terjadwal | Terposting | Gagal
- Kalender view — tampilkan konten berdasarkan tanggal jadwal
- Tombol "Buat Konten Baru" → buka form buat konten
- Editor konten: input caption, upload media (gambar/video), preview per platform
- Multi-platform select → pilih platform tujuan (Combobox multi-select)
- Toggle: "Posting Sekarang" vs "Jadwalkan" (tampilkan datetime picker jika jadwal)
- Edit konten → hanya untuk status draft atau scheduled
- Hapus konten → soft delete, set `dihapus_pada`
- Status konten diperbarui otomatis oleh background job setelah berhasil/gagal diposting

Tipe konten per platform:
- TikTok: video (reels), post
- Facebook: post, story, reels
- Instagram: post, story, reels
- Twitter: tweet (teks + media)
- WhatsApp: pesan broadcast (tidak ada post publik)

Form: Banyak field → buat PAGE TERSENDIRI (bukan modal)
  Lokasi: `/components/organisms/forms/FormKonten.tsx`
Validasi: `schemaBuatKonten` dari Zod
RTK Query: `useGetDaftarKontenQuery`, `useBuatKontenMutation`, `useUpdateKontenMutation`, `useHapusKontenMutation`

---

### Modul 4 — Analitik (`/analytic`)

Tujuan: Memantau performa akun dan konten secara visual.

Fitur yang harus ada:
- Summary cards: total followers, reach, impressions, engagement rate
- Grafik tren engagement (line chart / bar chart) dengan filter periode: 7 hari / 30 hari / custom
- Tabel top konten berdasarkan likes, komentar, share — sortable
- Filter per platform (Combobox)
- Tombol Export → download data sebagai CSV atau Excel

RTK Query: `useGetAnalitikQuery`
Data diambil dari tabel `m_analitik` yang diisi oleh background job harian

---

## ATURAN CLEAN CODE (WAJIB)

### Komponen
- Satu komponen maksimal 200 baris. Lebih dari itu HARUS dipecah.
- Pisahkan logic dari tampilan: business logic di custom hooks, bukan di dalam JSX.
- Beri nama custom hook dengan prefix `use`: `useDaftarKonten`, `useFilterChat`.
- Komponen harus bisa dibaca tanpa perlu buka file lain untuk memahami tujuannya.

### TypeScript
- Dilarang `any`. Selalu buat interface atau type yang eksplisit.
- Semua props wajib bertipe dengan `interface Props`.
- Response API wajib bertipe sesuai model Prisma atau DTO yang didefinisikan.
- Infer type dari Zod schema: `type FormBuatKonten = z.infer<typeof schemaBuatKonten>`

### API Route (Next.js)
- Setiap endpoint wajib validasi body/query pakai Zod sebelum diproses.
- Pisahkan service layer dari route handler.
- Selalu gunakan try-catch dengan pesan error yang jelas.
- Gunakan HTTP status code yang tepat: 200, 201, 400, 401, 404, 500.

### Database (Prisma)
- DILARANG `prisma.model.delete()` — selalu soft delete.
- Query data aktif SELALU filter `dihapus_pada: null`.
- Operasi multi-tabel gunakan `prisma.$transaction()`.

---

## KONVENSI PENAMAAN

| Entitas           | Konvensi          | Contoh                            |
|-------------------|-------------------|-----------------------------------|
| Komponen React    | PascalCase        | KartuKonten, FormJadwalKonten     |
| Custom Hooks      | camelCase + use   | useDaftarKonten, useFilterChat    |
| Handler/Fungsi    | camelCase + verb  | handleHapusKonten, handleBalasChat|
| Konstanta         | UPPER_SNAKE_CASE  | STATUS_KONTEN, TIPE_PLATFORM      |
| File komponen     | PascalCase.tsx    | FormKonten.tsx, ModalHapus.tsx    |
| File utility      | camelCase.ts      | formatTanggal.ts, validasiKonten.ts|
| API Route folder  | kebab-case        | /api/sosial-media/konten/[id]/    |
| Tabel database    | prefix + snake    | m_platform, c_media_konten        |

---

## MATRIKS FITUR PER PLATFORM

| Fitur                  | TikTok | Facebook | Instagram | WhatsApp | Twitter |
|------------------------|--------|----------|-----------|----------|---------|
| Kelola Chat / Inbox    | ✓      | ✓        | ✓         | ✓        | ✓       |
| Buat Postingan         | ✓      | ✓        | ✓         | —        | ✓       |
| Buat Story / Reels     | ✓      | ✓        | ✓         | —        | —       |
| Schedule Content       | ✓      | ✓        | ✓         | ✓        | ✓       |
| Analitik / Metrik      | ✓      | ✓        | ✓         | ✓        | ✓       |
| Koneksi Akun OAuth     | ✓      | ✓        | ✓         | ✓        | ✓       |
| Upload Media           | ✓      | ✓        | ✓         | —        | ✓       |

---

## URUTAN PENGERJAAN (PRIORITAS)

### Sprint 1 — Fondasi (HARUS SELESAI DULU)
1. Buat skema Prisma semua tabel (m_, c_, r_) + jalankan migrasi
2. Seed data tabel `m_platform` untuk 5 platform
3. Setup `sosialMediaApi.ts` (RTK Query) dan daftarkan ke Redux store
4. Buat Zod schema di `/lib/validations/sosialMedia.ts`
5. Implementasi halaman Login/Koneksi Akun per platform (OAuth flow)

### Sprint 2 — Modul Chat
6. Implementasi unified inbox (baca pesan dari semua platform)
7. Implementasi balas pesan per platform
8. Filter inbox by platform & status
9. Badge counter pesan belum dibaca di sidebar

### Sprint 3 — Modul Content
10. Form buat konten (page tersendiri) + upload media
11. Multi-platform publish (posting sekarang)
12. Schedule content + background job (cron)
13. Kalender view konten terjadwal

### Sprint 4 — Analitik & Polish
14. Dashboard analitik (summary cards + grafik tren)
15. Tabel top konten
16. Export CSV/Excel
17. Notifikasi real-time pesan baru

---

## CATATAN PENTING UNTUK AI AGENT

1. Selalu ikuti struktur folder yang sudah ada di project sebelum membuat file baru.
2. Sebelum membuat komponen, cek apakah ada komponen serupa yang sudah ada untuk dijadikan referensi pola (terutama untuk CRUD, form, dan modal).
3. Setiap kali membuat endpoint API baru, pastikan ada Zod validation di awal handler.
4. Setiap tabel baru di Prisma WAJIB punya prefix m_/c_/r_ dan 3 field audit (dibuat_pada, diperbarui_pada, dihapus_pada).
5. Gunakan Combobox untuk semua input pilihan, jangan pakai `<select>` HTML biasa.
6. Gunakan React Icons untuk semua ikon, jangan import SVG atau pakai emoji.
7. Saat generate kode untuk RTK Query, selalu sertakan `providesTags` dan `invalidatesTags` yang tepat agar cache ter-invalidate dengan benar.
8. Semua operasi hapus adalah SOFT DELETE — update field `dihapus_pada`, bukan delete record.
