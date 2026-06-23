# PRD — Dashboard Links
# Aplikasi Karang Taruna — Fitur Baru
# Versi: 1.0.0 | Tanggal: 23 Juni 2026 | Status: Draft

---

## KONTEKS PROYEK

Ini adalah PRD untuk menambahkan fitur baru bernama **Dashboard Links** ke dalam aplikasi Karang Taruna yang sudah ada.

Fitur ini mencakup 3 sub-fitur utama:
1. **Short Link** — buat & kelola tautan pendek dengan analitik klik
2. **QR Code** — buat QR Code dengan kustomisasi penuh (logo, warna, styling) seperti QRCode Monkey namun lebih clean
3. **Linktree** — buat halaman profil link dengan 10–20 tema premium modern

Semua halaman wajib mendukung **dark mode dan light mode** menggunakan komponen dark mode yang sudah ada di project.
Semua padding, margin, dan layout wajib **clean dan responsif** (mobile-first dengan Tailwind breakpoints).

---

## TECH STACK WAJIB

Semua implementasi HARUS mengikuti aturan berikut. Tidak boleh ada penyimpangan.

- Framework: Next.js (App Router)
- Bahasa: TypeScript (strict mode, dilarang pakai `any`)
- ORM Database: Prisma
- Validasi Form: Zod (wajib di semua form dan API handler)
- State Management & Data Fetching: Redux Toolkit + RTK Query
- Icons: React Icons (dilarang pakai emoji atau SVG inline — gunakan `react-icons` untuk semua ikon termasuk ikon sosial media di linktree)
- Komponen Dropdown/Select: Combobox (ikuti komponen yang sudah ada di project)
- CSS: Tailwind CSS (dilarang inline style, wajib dark mode class `dark:`)
- Dark Mode: gunakan komponen toggle dark mode yang sudah ada di project
- QR Code Library: `qrcode.react` atau `react-qr-code` + `qrcode` (untuk generate server-side)
- Color Picker: `react-colorful` (untuk kustomisasi warna QR Code)

---

## KONVENSI DATABASE (WAJIB DIIKUTI)

### Prefix Nama Tabel

- `m_namatabel` → tabel utama / master
- `c_namatabel` → tabel turunan (child), berelasi ke tabel master
- `r_namatabel` → tabel pivot (many-to-many relation)

### Field Audit Wajib di Setiap Model

Setiap model Prisma WAJIB memiliki 3 field berikut persis seperti ini:

```prisma
dibuat_pada      DateTime  @default(now())
diperbarui_pada  DateTime  @updatedAt
dihapus_pada     DateTime?   // Soft delete
```

### Aturan Soft Delete

- DILARANG menggunakan `prisma.model.delete()`
- Gunakan: `prisma.model.update({ where: { id }, data: { dihapus_pada: new Date() } })`
- Setiap query data aktif WAJIB filter: `where: { dihapus_pada: null }`

---

## STRUKTUR FOLDER (WAJIB IKUTI ARSITEKTUR EXISTING)

Tambahkan folder-folder berikut di dalam struktur Next.js App Router yang sudah ada:

```
(links)/
├── short-link/
│   ├── page.tsx                  → Halaman daftar short link + analitik ringkasan
│   └── [kode]/
│       └── page.tsx              → Halaman detail analitik per short link
├── qr-code/
│   ├── page.tsx                  → Halaman daftar QR Code yang sudah dibuat
│   └── create/
│       └── page.tsx              → Halaman buat QR Code (banyak field → page sendiri)
└── linktree/
    ├── page.tsx                  → Halaman daftar halaman linktree milik user
    ├── create/
    │   └── page.tsx              → Halaman buat linktree baru (pilih tema, isi konten)
    └── [slug]/
        ├── edit/
        │   └── page.tsx          → Halaman edit linktree
        └── page.tsx              → Halaman publik linktree (tanpa layout app)
```

### Lokasi Komponen Wajib

```
/components/organisms/forms/
  FormShortLink.tsx               → Form buat/edit short link (sedikit field → bisa modal)
  FormQrCode.tsx                  → Form buat QR Code (banyak field → page sendiri)
  FormLinktree.tsx                → Form buat/edit linktree (banyak field → page sendiri)
  FormTambahLinkLinktree.tsx      → Form tambah item link di linktree (sedikit field → modal)

/components/organisms/modals/links/
  short-link/
    ModalBuatShortLink.tsx        → Modal buat short link baru
    ModalEditShortLink.tsx        → Modal edit short link
    ModalKonfirmasiHapus.tsx      → Modal konfirmasi hapus short link
    ModalDetailAnalitik.tsx       → Modal detail analitik klik per short link
  qr-code/
    ModalKonfirmasiHapusQr.tsx    → Modal konfirmasi hapus QR Code
    ModalPreviewQr.tsx            → Modal preview QR Code sebelum download
  linktree/
    ModalKonfirmasiHapusLinktree.tsx
    ModalTambahLink.tsx           → Modal tambah link item ke halaman linktree
    ModalEditLink.tsx             → Modal edit link item
    ModalPilihTema.tsx            → Modal pilih tema linktree (tampilkan preview 10-20 tema)

/components/organisms/cards/links/
  KartuShortLink.tsx              → Card item short link di daftar
  KartuQrCode.tsx                 → Card item QR Code di daftar
  KartuLinktree.tsx               → Card item linktree di daftar
  KartuAnalitikKlik.tsx           → Card ringkasan analitik (total klik, unik, dll.)

/components/molecules/links/
  PreviewQrCode.tsx               → Komponen preview QR Code real-time
  PanelKustomQr.tsx               → Panel kiri/kanan kustomisasi QR Code
  PreviewLinktree.tsx             → Komponen preview halaman linktree real-time
  GrafikKlikHarian.tsx            → Grafik line/bar klik harian
  BadgeStatusLink.tsx             → Badge status aktif/nonaktif/expired

/components/atoms/links/
  TombolSalinLink.tsx             → Tombol salin URL ke clipboard
  TombolDownloadQr.tsx            → Tombol download QR Code (PNG/SVG/PDF)
  InputColorPicker.tsx            → Input color picker dengan react-colorful
  SliderBorderRadius.tsx          → Slider border radius untuk kustomisasi QR
  ToggleAktifLink.tsx             → Toggle aktif/nonaktif short link

/store/api/
  linksApi.ts                     → Semua RTK Query endpoints fitur links

/store/slices/
  linksSlice.ts                   → Redux slice untuk UI state fitur links (preview QR, tema aktif, dll.)

/lib/validations/
  links.ts                        → Semua Zod schema untuk form fitur links

/lib/utils/
  generateKodeUnik.ts             → Fungsi generate kode pendek unik (nanoid/custom)
  formatAnalitik.ts               → Fungsi format data analitik untuk grafik

/app/api/links/
  short-link/route.ts             → GET (list) + POST (create)
  short-link/[id]/route.ts        → GET + PUT + DELETE (soft)
  short-link/[id]/analitik/route.ts → GET analitik klik per short link
  qr-code/route.ts                → GET (list) + POST (create)
  qr-code/[id]/route.ts           → GET + PUT + DELETE (soft)
  linktree/route.ts               → GET (list) + POST (create)
  linktree/[id]/route.ts          → GET + PUT + DELETE (soft)
  linktree/[id]/links/route.ts    → GET + POST item link di linktree
  linktree/[id]/links/[linkId]/route.ts → PUT + DELETE item link
  redirect/[kode]/route.ts        → Redirect short link + catat klik

/app/[slug]/
  page.tsx                        → Halaman publik linktree (SSR, tanpa auth, tanpa layout app)
```

---

## SKEMA DATABASE PRISMA

### m_short_link
Tabel master short link.

```prisma
model m_short_link {
  id               Int       @id @default(autoincrement())
  user_id          String    // relasi ke user yang membuat
  judul            String?
  url_asli         String    @db.Text
  kode             String    @unique  // kode pendek unik, contoh: "abc123"
  url_pendek       String    // full URL pendek, contoh: "https://domain.com/abc123"
  aktif            Boolean   @default(true)
  kedaluwarsa_pada DateTime?
  password         String?   // opsional, proteksi dengan password
  dibuat_pada      DateTime  @default(now())
  diperbarui_pada  DateTime  @updatedAt
  dihapus_pada     DateTime?

  klik             c_klik_short_link[]
}
```

### c_klik_short_link
Tabel turunan — log setiap klik pada short link.

```prisma
model c_klik_short_link {
  id               Int       @id @default(autoincrement())
  short_link_id    Int
  ip_address       String?
  user_agent       String?   @db.Text
  referer          String?
  negara           String?
  kota             String?
  perangkat        String?   // desktop | mobile | tablet
  browser          String?
  os               String?
  diklik_pada      DateTime  @default(now())
  dibuat_pada      DateTime  @default(now())
  diperbarui_pada  DateTime  @updatedAt
  dihapus_pada     DateTime?

  short_link       m_short_link @relation(fields: [short_link_id], references: [id])
}
```

### m_qr_code
Tabel master QR Code yang sudah dibuat.

```prisma
model m_qr_code {
  id                  Int       @id @default(autoincrement())
  user_id             String
  judul               String
  konten              String    @db.Text  // URL atau teks yang di-encode
  tipe_konten         String    // url | teks | email | telepon | wifi | vcard
  
  // Styling QR
  warna_depan         String    @default("#000000")  // foreground color
  warna_belakang      String    @default("#FFFFFF")   // background color
  gaya_titik          String    @default("square")    // square | rounded | dots | classy | classy-rounded | extra-rounded
  gaya_sudut_luar     String    @default("square")    // square | extra-rounded | dot
  gaya_sudut_dalam    String    @default("square")    // square | dot
  warna_sudut_luar    String?
  warna_sudut_dalam   String?
  
  // Logo tengah
  logo_url            String?   // URL logo yang diupload
  logo_ukuran         Int       @default(20)          // persen luas logo dari QR (5-35)
  logo_margin         Int       @default(5)           // margin di sekitar logo
  logo_hapus_bg       Boolean   @default(true)        // hapus background di belakang logo
  
  // Ukuran & margin
  ukuran              Int       @default(300)         // pixel
  margin              Int       @default(10)          // margin luar QR
  
  // Level koreksi error
  level_koreksi       String    @default("M")         // L | M | Q | H
  
  // File hasil
  gambar_url          String?   // URL gambar QR yang tersimpan
  
  dibuat_pada         DateTime  @default(now())
  diperbarui_pada     DateTime  @updatedAt
  dihapus_pada        DateTime?
}
```

### m_linktree
Tabel master halaman linktree milik user.

```prisma
model m_linktree {
  id               Int       @id @default(autoincrement())
  user_id          String
  slug             String    @unique   // URL publik: domain.com/slug
  judul            String
  bio              String?
  foto_profil_url  String?
  tema             String    @default("minimal-light")  // kode tema yang dipilih
  aktif            Boolean   @default(true)
  
  // Kustomisasi tema
  warna_primer     String?   // override warna primer tema
  warna_latar      String?   // override warna latar tema
  font_kustom      String?   // override font tema
  
  // SEO & meta
  meta_judul       String?
  meta_deskripsi   String?
  
  dibuat_pada      DateTime  @default(now())
  diperbarui_pada  DateTime  @updatedAt
  dihapus_pada     DateTime?

  links            c_link_linktree[]
  klik             c_klik_linktree[]
}
```

### c_link_linktree
Tabel turunan — item link di dalam halaman linktree.

```prisma
model c_link_linktree {
  id               Int       @id @default(autoincrement())
  linktree_id      Int
  judul            String
  url              String    @db.Text
  ikon             String?   // nama icon dari react-icons, contoh: "FaInstagram"
  warna_ikon       String?
  urutan           Int       @default(0)   // untuk drag-and-drop reorder
  aktif            Boolean   @default(true)
  
  dibuat_pada      DateTime  @default(now())
  diperbarui_pada  DateTime  @updatedAt
  dihapus_pada     DateTime?

  linktree         m_linktree @relation(fields: [linktree_id], references: [id])
}
```

### c_klik_linktree
Tabel turunan — log klik di halaman linktree (per halaman, bukan per link).

```prisma
model c_klik_linktree {
  id               Int       @id @default(autoincrement())
  linktree_id      Int
  link_id          Int?      // null jika klik halaman, ada nilai jika klik link spesifik
  ip_address       String?
  user_agent       String?   @db.Text
  referer          String?
  negara           String?
  perangkat        String?
  diklik_pada      DateTime  @default(now())
  dibuat_pada      DateTime  @default(now())
  diperbarui_pada  DateTime  @updatedAt
  dihapus_pada     DateTime?

  linktree         m_linktree @relation(fields: [linktree_id], references: [id])
}
```

---

## ZOD SCHEMA VALIDASI

File: `/lib/validations/links.ts`

```typescript
import { z } from 'zod';

// ── Short Link ───────────────────────────────────────────────────────────────

export const schemaBuatShortLink = z.object({
  judul:            z.string().max(100).optional(),
  url_asli:         z.string().url('URL tidak valid').min(1, 'URL wajib diisi'),
  kode_kustom:      z.string().min(3).max(20).regex(/^[a-zA-Z0-9-_]+$/, 'Hanya huruf, angka, - dan _').optional(),
  kedaluwarsa_pada: z.string().datetime().optional(),
  password:         z.string().min(4).max(50).optional(),
});

export const schemaEditShortLink = schemaBuatShortLink.extend({
  aktif: z.boolean(),
});

export type FormBuatShortLink = z.infer<typeof schemaBuatShortLink>;
export type FormEditShortLink = z.infer<typeof schemaEditShortLink>;

// ── QR Code ──────────────────────────────────────────────────────────────────

export const schemaBuatQrCode = z.object({
  judul:              z.string().min(1, 'Judul wajib diisi').max(100),
  konten:             z.string().min(1, 'Konten wajib diisi'),
  tipe_konten:        z.enum(['url', 'teks', 'email', 'telepon', 'wifi', 'vcard']),
  warna_depan:        z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#000000'),
  warna_belakang:     z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#FFFFFF'),
  gaya_titik:         z.enum(['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded']).default('square'),
  gaya_sudut_luar:    z.enum(['square', 'extra-rounded', 'dot']).default('square'),
  gaya_sudut_dalam:   z.enum(['square', 'dot']).default('square'),
  warna_sudut_luar:   z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  warna_sudut_dalam:  z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  logo_url:           z.string().url().optional().or(z.literal('')),
  logo_ukuran:        z.number().min(5).max(35).default(20),
  logo_margin:        z.number().min(0).max(20).default(5),
  logo_hapus_bg:      z.boolean().default(true),
  ukuran:             z.number().min(100).max(2000).default(300),
  margin:             z.number().min(0).max(50).default(10),
  level_koreksi:      z.enum(['L', 'M', 'Q', 'H']).default('M'),
});

export type FormBuatQrCode = z.infer<typeof schemaBuatQrCode>;

// ── Linktree ─────────────────────────────────────────────────────────────────

export const schemaBuatLinktree = z.object({
  slug:             z.string().min(3).max(50).regex(/^[a-zA-Z0-9-_]+$/, 'Hanya huruf, angka, - dan _'),
  judul:            z.string().min(1, 'Judul wajib diisi').max(100),
  bio:              z.string().max(300).optional(),
  tema:             z.string().min(1, 'Tema wajib dipilih'),
  foto_profil_url:  z.string().url().optional().or(z.literal('')),
  warna_primer:     z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  warna_latar:      z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  meta_judul:       z.string().max(60).optional(),
  meta_deskripsi:   z.string().max(160).optional(),
});

export const schemaTambahLinkLinktree = z.object({
  judul:      z.string().min(1, 'Judul wajib diisi').max(100),
  url:        z.string().url('URL tidak valid').min(1, 'URL wajib diisi'),
  ikon:       z.string().optional(),
  warna_ikon: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  aktif:      z.boolean().default(true),
});

export const schemaUrutanLink = z.object({
  urutan: z.array(z.object({ id: z.number(), urutan: z.number() })),
});

export type FormBuatLinktree     = z.infer<typeof schemaBuatLinktree>;
export type FormTambahLink       = z.infer<typeof schemaTambahLinkLinktree>;
export type FormUrutanLink       = z.infer<typeof schemaUrutanLink>;
```

---

## IMPLEMENTASI RTK QUERY

File: `/store/api/linksApi.ts`

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  ShortLink, QrCode, Linktree, LinkLinktree,
  AnalitikShortLink, AnalitikLinktree,
  FormBuatShortLink, FormEditShortLink,
  FormBuatQrCode, FormBuatLinktree, FormTambahLink, FormUrutanLink
} from '@/types/links';

export const linksApi = createApi({
  reducerPath: 'linksApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/links' }),
  tagTypes: ['ShortLink', 'QrCode', 'Linktree', 'LinkItem', 'Analitik'],

  endpoints: (builder) => ({

    // ── Short Link ──────────────────────────────────────────────────────────

    getDaftarShortLink: builder.query<ShortLink[], void>({
      query: () => '/short-link',
      providesTags: ['ShortLink'],
    }),
    getDetailShortLink: builder.query<ShortLink, number>({
      query: (id) => `/short-link/${id}`,
      providesTags: ['ShortLink'],
    }),
    getAnalitikShortLink: builder.query<AnalitikShortLink, { id: number; periode: '7d' | '30d' | 'all' }>({
      query: ({ id, periode }) => `/short-link/${id}/analitik?periode=${periode}`,
      providesTags: ['Analitik'],
    }),
    buatShortLink: builder.mutation<ShortLink, FormBuatShortLink>({
      query: (body) => ({ url: '/short-link', method: 'POST', body }),
      invalidatesTags: ['ShortLink'],
    }),
    editShortLink: builder.mutation<ShortLink, { id: number } & FormEditShortLink>({
      query: ({ id, ...body }) => ({ url: `/short-link/${id}`, method: 'PUT', body }),
      invalidatesTags: ['ShortLink'],
    }),
    hapusShortLink: builder.mutation<void, number>({
      query: (id) => ({ url: `/short-link/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ShortLink'],
    }),
    toggleAktifShortLink: builder.mutation<ShortLink, { id: number; aktif: boolean }>({
      query: ({ id, aktif }) => ({ url: `/short-link/${id}/toggle`, method: 'PATCH', body: { aktif } }),
      invalidatesTags: ['ShortLink'],
    }),

    // ── QR Code ────────────────────────────────────────────────────────────

    getDaftarQrCode: builder.query<QrCode[], void>({
      query: () => '/qr-code',
      providesTags: ['QrCode'],
    }),
    getDetailQrCode: builder.query<QrCode, number>({
      query: (id) => `/qr-code/${id}`,
      providesTags: ['QrCode'],
    }),
    buatQrCode: builder.mutation<QrCode, FormBuatQrCode>({
      query: (body) => ({ url: '/qr-code', method: 'POST', body }),
      invalidatesTags: ['QrCode'],
    }),
    editQrCode: builder.mutation<QrCode, { id: number } & Partial<FormBuatQrCode>>({
      query: ({ id, ...body }) => ({ url: `/qr-code/${id}`, method: 'PUT', body }),
      invalidatesTags: ['QrCode'],
    }),
    hapusQrCode: builder.mutation<void, number>({
      query: (id) => ({ url: `/qr-code/${id}`, method: 'DELETE' }),
      invalidatesTags: ['QrCode'],
    }),

    // ── Linktree ───────────────────────────────────────────────────────────

    getDaftarLinktree: builder.query<Linktree[], void>({
      query: () => '/linktree',
      providesTags: ['Linktree'],
    }),
    getDetailLinktree: builder.query<Linktree, number>({
      query: (id) => `/linktree/${id}`,
      providesTags: ['Linktree'],
    }),
    getAnalitikLinktree: builder.query<AnalitikLinktree, { id: number; periode: '7d' | '30d' | 'all' }>({
      query: ({ id, periode }) => `/linktree/${id}/analitik?periode=${periode}`,
      providesTags: ['Analitik'],
    }),
    buatLinktree: builder.mutation<Linktree, FormBuatLinktree>({
      query: (body) => ({ url: '/linktree', method: 'POST', body }),
      invalidatesTags: ['Linktree'],
    }),
    editLinktree: builder.mutation<Linktree, { id: number } & Partial<FormBuatLinktree>>({
      query: ({ id, ...body }) => ({ url: `/linktree/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Linktree'],
    }),
    hapusLinktree: builder.mutation<void, number>({
      query: (id) => ({ url: `/linktree/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Linktree'],
    }),
    cekSlugTersedia: builder.query<{ tersedia: boolean }, string>({
      query: (slug) => `/linktree/cek-slug?slug=${slug}`,
    }),

    // ── Link Item di Linktree ───────────────────────────────────────────────

    getDaftarLinkLinktree: builder.query<LinkLinktree[], number>({
      query: (linktreeId) => `/linktree/${linktreeId}/links`,
      providesTags: ['LinkItem'],
    }),
    tambahLinkLinktree: builder.mutation<LinkLinktree, { linktreeId: number } & FormTambahLink>({
      query: ({ linktreeId, ...body }) => ({ url: `/linktree/${linktreeId}/links`, method: 'POST', body }),
      invalidatesTags: ['LinkItem'],
    }),
    editLinkLinktree: builder.mutation<LinkLinktree, { linktreeId: number; linkId: number } & Partial<FormTambahLink>>({
      query: ({ linktreeId, linkId, ...body }) => ({ url: `/linktree/${linktreeId}/links/${linkId}`, method: 'PUT', body }),
      invalidatesTags: ['LinkItem'],
    }),
    hapusLinkLinktree: builder.mutation<void, { linktreeId: number; linkId: number }>({
      query: ({ linktreeId, linkId }) => ({ url: `/linktree/${linktreeId}/links/${linkId}`, method: 'DELETE' }),
      invalidatesTags: ['LinkItem'],
    }),
    urutanUlangLink: builder.mutation<void, { linktreeId: number } & FormUrutanLink>({
      query: ({ linktreeId, ...body }) => ({ url: `/linktree/${linktreeId}/links/urutan`, method: 'PATCH', body }),
      invalidatesTags: ['LinkItem'],
    }),

  }),
});

export const {
  useGetDaftarShortLinkQuery,
  useGetDetailShortLinkQuery,
  useGetAnalitikShortLinkQuery,
  useBuatShortLinkMutation,
  useEditShortLinkMutation,
  useHapusShortLinkMutation,
  useToggleAktifShortLinkMutation,
  useGetDaftarQrCodeQuery,
  useGetDetailQrCodeQuery,
  useBuatQrCodeMutation,
  useEditQrCodeMutation,
  useHapusQrCodeMutation,
  useGetDaftarLinktreeQuery,
  useGetDetailLinktreeQuery,
  useGetAnalitikLinktreeQuery,
  useBuatLinkTreeMutation,
  useEditLinktreeMutation,
  useHapusLinktreeMutation,
  useCekSlugTersediaQuery,
  useGetDaftarLinkLinktreeQuery,
  useTambahLinkLinkTreeMutation,
  useEditLinkLinkTreeMutation,
  useHapusLinkLinkTreeMutation,
  useUrutanUlangLinkMutation,
} = linksApi;
```

---

## DETAIL FITUR PER MODUL

---

### MODUL 1 — SHORT LINK (`/short-link`)

#### Halaman Daftar Short Link (`page.tsx`)

Komponen yang harus dipecah:
- `RingkasanAnalitikLinks.tsx` — kartu total link aktif, total klik hari ini, total klik bulan ini
- `DaftarShortLink.tsx` — wrapper list + state loading/kosong
- `KartuShortLink.tsx` — satu item short link (judul, URL pendek, klik, status, tombol aksi)
- `BadgeStatusLink.tsx` — badge aktif/nonaktif/expired
- `TombolSalinLink.tsx` — salin URL pendek ke clipboard
- `ToggleAktifLink.tsx` — toggle aktif/nonaktif langsung dari kartu

Fitur di halaman ini:
- Tombol "Buat Short Link" → buka `ModalBuatShortLink`
- Setiap kartu punya: tombol salin, toggle aktif, tombol analitik, tombol edit, tombol hapus
- Klik "Analitik" → buka `ModalDetailAnalitik` atau navigasi ke `/short-link/[kode]`
- Search bar untuk filter berdasarkan judul atau URL

#### Modal Buat Short Link (`ModalBuatShortLink.tsx`)

Field yang ada (sedikit → gunakan modal):
- URL Asli (input text, wajib, validasi URL)
- Judul / Label (input text, opsional)
- Kode Kustom (input text, opsional — jika kosong, generate otomatis)
- Tanggal Kedaluwarsa (date picker, opsional)
- Password Proteksi (input password, opsional)

Validasi: `schemaBuatShortLink` dari Zod
RTK Query: `useBuatShortLinkMutation`

#### Halaman Detail Analitik (`/short-link/[kode]/page.tsx`)

Komponen yang harus dipecah:
- `HeaderDetailShortLink.tsx` — URL pendek, URL asli, tanggal dibuat, tombol salin, toggle aktif
- `KartuMetrikKlik.tsx` — total klik, klik unik, klik hari ini, klik bulan ini
- `GrafikKlikHarian.tsx` — line chart klik per hari (filter 7 hari / 30 hari)
- `TabelKlikPerNegara.tsx` — tabel distribusi klik per negara
- `TabelKlikPerPerangkat.tsx` — tabel distribusi desktop/mobile/tablet
- `TabelKlikPerBrowser.tsx` — tabel distribusi browser

RTK Query: `useGetAnalitikShortLinkQuery`

---

### MODUL 2 — QR CODE (`/qr-code`)

#### Halaman Daftar QR Code (`page.tsx`)

Komponen yang harus dipecah:
- `DaftarQrCode.tsx` — wrapper list + state loading/kosong
- `KartuQrCode.tsx` — satu item QR Code (thumbnail gambar QR, judul, konten, tanggal)
- `TombolDownloadQr.tsx` — dropdown download format: PNG / SVG / PDF

Fitur:
- Tombol "Buat QR Code Baru" → navigasi ke `/qr-code/create`
- Setiap kartu punya: preview thumbnail, tombol download, tombol edit, tombol hapus
- Klik thumbnail → buka `ModalPreviewQr` (tampilkan QR ukuran besar)

#### Halaman Buat QR Code (`/qr-code/create/page.tsx`)

Ini adalah halaman tersendiri (bukan modal) karena banyak field kustomisasi.

Layout halaman: **dua kolom**
- Kolom Kiri (60%): Panel kustomisasi QR (`PanelKustomQr.tsx`)
- Kolom Kanan (40%): Preview QR real-time (`PreviewQrCode.tsx`) + tombol simpan & download

Komponen yang harus dipecah:

**`PanelKustomQr.tsx`** memiliki tab/seksi:
1. **Tab Konten**
   - Pilih tipe konten (Combobox): URL | Teks | Email | Telepon | WiFi | vCard
   - Input konten sesuai tipe yang dipilih
   - Judul QR Code

2. **Tab Desain Titik**
   - Pilih gaya titik QR (visual selector dengan preview mini): square | rounded | dots | classy | classy-rounded | extra-rounded
   - Color picker warna titik (`InputColorPicker.tsx`) menggunakan `react-colorful`
   - Opsi gradien warna (dua warna + arah gradien)

3. **Tab Desain Sudut**
   - Pilih gaya sudut luar (visual selector): square | extra-rounded | dot
   - Pilih gaya sudut dalam (visual selector): square | dot
   - Color picker warna sudut luar & dalam (bisa berbeda dari warna titik)

4. **Tab Logo**
   - Upload logo (drag & drop atau klik, format PNG/SVG/JPG)
   - Slider ukuran logo (5–35%, tampilkan nilai %)
   - Slider margin di sekitar logo (0–20px)
   - Toggle "Hapus background di belakang logo"
   - Tombol hapus logo

5. **Tab Opsi**
   - Slider ukuran QR (100–2000px)
   - Slider margin luar QR (0–50)
   - Pilih level koreksi error (Combobox): L (7%) | M (15%) | Q (25%) | H (30%)
   - Warna latar belakang (`InputColorPicker.tsx`)

**`PreviewQrCode.tsx`**:
- Tampilkan QR Code real-time menggunakan `qrcode.react`
- Update setiap kali ada perubahan setting (debounce 300ms)
- Tampilkan peringatan jika konten kosong
- Tombol "Simpan QR Code" → `useBuatQrCodeMutation` → simpan ke DB + upload gambar
- Tombol "Download PNG" → generate dan download langsung
- Tombol "Download SVG" → download dalam format SVG

Form: banyak field → **PAGE TERSENDIRI** di `/qr-code/create`
File form: `/components/organisms/forms/FormQrCode.tsx`
Validasi: `schemaBuatQrCode` dari Zod
RTK Query: `useBuatQrCodeMutation`
Library: `qrcode.react` untuk preview, `qrcode` untuk generate server-side

---

### MODUL 3 — LINKTREE (`/linktree`)

#### Halaman Daftar Linktree (`page.tsx`)

Komponen yang harus dipecah:
- `DaftarLinktree.tsx` — wrapper list + state loading/kosong
- `KartuLinktree.tsx` — satu item linktree (foto profil, judul, slug, jumlah link, tema, tombol aksi)
- `BadgeTemaLinktree.tsx` — badge nama tema yang dipakai

Fitur:
- Tombol "Buat Halaman Baru" → navigasi ke `/linktree/create`
- Setiap kartu punya: tombol buka halaman publik, tombol salin URL, tombol edit, tombol analitik, tombol hapus
- Tombol "Lihat Halaman" → buka di tab baru `domain.com/[slug]`

#### Halaman Buat Linktree (`/linktree/create/page.tsx`)

Layout: **dua kolom**
- Kolom Kiri (55%): Form konfigurasi + daftar link
- Kolom Kanan (45%): Preview mobile real-time (`PreviewLinktree.tsx`)

Seksi form konfigurasi (`FormLinktree.tsx`):
1. **Informasi Profil**
   - Upload foto profil (drag & drop)
   - Judul / Nama (input text)
   - Bio (textarea, max 300 karakter)
   - Slug / URL (input text + cek ketersediaan real-time via `useCekSlugTersediaQuery`)

2. **Pilih Tema**
   - Grid preview 10–20 tema (lihat daftar tema di bawah)
   - Klik tema → pilih & update preview
   - Tombol "Lihat Semua Tema" → buka `ModalPilihTema` (grid lebih besar)

3. **Kustomisasi Warna (opsional)**
   - Override warna primer tema (`InputColorPicker.tsx`)
   - Override warna latar tema (`InputColorPicker.tsx`)

4. **SEO (opsional)**
   - Meta judul (input text, max 60 karakter)
   - Meta deskripsi (textarea, max 160 karakter)

Seksi daftar link:
- Daftar link yang sudah ditambahkan (drag-and-drop reorder)
- Setiap item punya: ikon (dari react-icons), judul, URL, toggle aktif, tombol edit, tombol hapus
- Tombol "Tambah Link" → buka `ModalTambahLink`

Form: banyak field → **PAGE TERSENDIRI**
File form: `/components/organisms/forms/FormLinktree.tsx`
Validasi: `schemaBuatLinktree` dari Zod
RTK Query: `useBuatLinkTreeMutation`, `useTambahLinkLinkTreeMutation`

#### Modal Tambah Link (`ModalTambahLink.tsx`)

Field (sedikit → gunakan modal):
- Judul Link (input text)
- URL (input text, validasi URL)
- Ikon (Combobox dengan preview ikon dari react-icons — tampilkan nama ikon)
- Warna ikon (color picker mini)
- Status Aktif (toggle)

Validasi: `schemaTambahLinkLinktree` dari Zod
RTK Query: `useTambahLinkLinkTreeMutation`

#### Halaman Publik Linktree (`/app/[slug]/page.tsx`)

- Halaman ini adalah halaman PUBLIK tanpa autentikasi dan tanpa layout aplikasi
- Render server-side (SSR) untuk SEO
- Ambil data linktree berdasarkan slug dari Prisma langsung (bukan API route)
- Catat klik halaman ke tabel `c_klik_linktree` setiap kali halaman dibuka
- Catat klik per link ke tabel `c_klik_linktree` saat link diklik (via API route)
- Tampilkan: foto profil, judul, bio, daftar link aktif dengan tema yang dipilih

#### Halaman Edit Linktree (`/linktree/[slug]/edit/page.tsx`)

- Layout sama dengan halaman buat, tapi diisi dengan data yang sudah ada
- Gunakan komponen form yang sama (`FormLinktree.tsx`)
- Daftar link langsung bisa di-reorder, edit, hapus, dan tambah

---

## DAFTAR 15 TEMA LINKTREE

Setiap tema didefinisikan sebagai objek konfigurasi TypeScript. Simpan di `/lib/tema-linktree.ts`.

```typescript
export const DAFTAR_TEMA = [
  {
    kode: 'minimal-light',
    nama: 'Minimal Light',
    deskripsi: 'Putih bersih, tipografi elegan, shadcn-style',
    latar: '#FFFFFF',
    warna_primer: '#18181B',
    warna_teks: '#18181B',
    warna_teks_sekunder: '#71717A',
    warna_tombol_latar: '#F4F4F5',
    warna_tombol_teks: '#18181B',
    warna_tombol_border: '#E4E4E7',
    font: 'Inter',
    border_radius_tombol: '0.5rem',
    gaya_tombol: 'outline',  // outline | solid | ghost | glass
  },
  {
    kode: 'minimal-dark',
    nama: 'Minimal Dark',
    deskripsi: 'Hitam elegan, cocok untuk brand profesional',
    latar: '#09090B',
    warna_primer: '#FAFAFA',
    warna_teks: '#FAFAFA',
    warna_teks_sekunder: '#A1A1AA',
    warna_tombol_latar: '#18181B',
    warna_tombol_teks: '#FAFAFA',
    warna_tombol_border: '#27272A',
    font: 'Inter',
    border_radius_tombol: '0.5rem',
    gaya_tombol: 'outline',
  },
  {
    kode: 'aurora',
    nama: 'Aurora',
    deskripsi: 'Gradien ungu-biru aurora borealis, modern & vibrant',
    latar: 'linear-gradient(135deg, #0F0C29, #302B63, #24243E)',
    warna_primer: '#A78BFA',
    warna_teks: '#FFFFFF',
    warna_teks_sekunder: '#C4B5FD',
    warna_tombol_latar: 'rgba(167, 139, 250, 0.15)',
    warna_tombol_teks: '#FFFFFF',
    warna_tombol_border: 'rgba(167, 139, 250, 0.4)',
    font: 'Plus Jakarta Sans',
    border_radius_tombol: '0.75rem',
    gaya_tombol: 'glass',
  },
  {
    kode: 'sunset',
    nama: 'Sunset',
    deskripsi: 'Gradien oranye-merah muda hangat seperti matahari terbenam',
    latar: 'linear-gradient(135deg, #FF6B6B, #FE9F43, #FF6B6B)',
    warna_primer: '#FFFFFF',
    warna_teks: '#FFFFFF',
    warna_teks_sekunder: 'rgba(255,255,255,0.8)',
    warna_tombol_latar: 'rgba(255,255,255,0.2)',
    warna_tombol_teks: '#FFFFFF',
    warna_tombol_border: 'rgba(255,255,255,0.4)',
    font: 'Poppins',
    border_radius_tombol: '9999px',
    gaya_tombol: 'glass',
  },
  {
    kode: 'ocean-depth',
    nama: 'Ocean Depth',
    deskripsi: 'Gradien biru teal dalam seperti lautan, tenang & premium',
    latar: 'linear-gradient(180deg, #0D3B66, #1A6985, #0D3B66)',
    warna_primer: '#5CE1E6',
    warna_teks: '#FFFFFF',
    warna_teks_sekunder: 'rgba(255,255,255,0.7)',
    warna_tombol_latar: 'rgba(92, 225, 230, 0.15)',
    warna_tombol_teks: '#5CE1E6',
    warna_tombol_border: 'rgba(92, 225, 230, 0.35)',
    font: 'DM Sans',
    border_radius_tombol: '0.5rem',
    gaya_tombol: 'outline',
  },
  {
    kode: 'neon-night',
    nama: 'Neon Night',
    deskripsi: 'Hitam pekat dengan aksen neon hijau, cyberpunk aesthetic',
    latar: '#0A0A0A',
    warna_primer: '#00FF87',
    warna_teks: '#FFFFFF',
    warna_teks_sekunder: '#A0A0A0',
    warna_tombol_latar: 'rgba(0, 255, 135, 0.1)',
    warna_tombol_teks: '#00FF87',
    warna_tombol_border: '#00FF87',
    font: 'Space Grotesk',
    border_radius_tombol: '0.25rem',
    gaya_tombol: 'outline',
  },
  {
    kode: 'pastel-dream',
    nama: 'Pastel Dream',
    deskripsi: 'Lembut pastel merah muda dan ungu, aesthetic & feminim',
    latar: 'linear-gradient(135deg, #FFF0F3, #F8EDFF)',
    warna_primer: '#D63384',
    warna_teks: '#3D2C3D',
    warna_teks_sekunder: '#8B6A8B',
    warna_tombol_latar: '#FFFFFF',
    warna_tombol_teks: '#D63384',
    warna_tombol_border: '#F0B8D0',
    font: 'DM Serif Display',
    border_radius_tombol: '9999px',
    gaya_tombol: 'solid',
  },
  {
    kode: 'forest',
    nama: 'Forest',
    deskripsi: 'Hijau alam yang dalam, cocok untuk brand organik & nature',
    latar: '#1A2E1A',
    warna_primer: '#6FCF97',
    warna_teks: '#E8F5E9',
    warna_teks_sekunder: '#A5D6A7',
    warna_tombol_latar: 'rgba(111, 207, 151, 0.15)',
    warna_tombol_teks: '#6FCF97',
    warna_tombol_border: 'rgba(111, 207, 151, 0.3)',
    font: 'Lato',
    border_radius_tombol: '0.5rem',
    gaya_tombol: 'outline',
  },
  {
    kode: 'gold-luxury',
    nama: 'Gold Luxury',
    deskripsi: 'Hitam & emas, kesan mewah dan premium tinggi',
    latar: '#0C0C0C',
    warna_primer: '#D4AF37',
    warna_teks: '#FFFFFF',
    warna_teks_sekunder: '#B8A370',
    warna_tombol_latar: 'rgba(212, 175, 55, 0.1)',
    warna_tombol_teks: '#D4AF37',
    warna_tombol_border: '#D4AF37',
    font: 'Cormorant Garamond',
    border_radius_tombol: '0.25rem',
    gaya_tombol: 'outline',
  },
  {
    kode: 'brutalist',
    nama: 'Brutalist',
    deskripsi: 'Border hitam tebal, warna blok solid, typography bold',
    latar: '#FFFBF0',
    warna_primer: '#000000',
    warna_teks: '#000000',
    warna_teks_sekunder: '#333333',
    warna_tombol_latar: '#FFE135',
    warna_tombol_teks: '#000000',
    warna_tombol_border: '#000000',
    font: 'Space Grotesk',
    border_radius_tombol: '0',
    gaya_tombol: 'solid',
  },
  {
    kode: 'glass-morphism',
    nama: 'Glass Morphism',
    deskripsi: 'Blur glassmorphism dengan gradien biru-ungu, modern UI trend',
    latar: 'linear-gradient(135deg, #1E1E2E, #2D2B55)',
    warna_primer: '#FFFFFF',
    warna_teks: '#FFFFFF',
    warna_teks_sekunder: 'rgba(255,255,255,0.6)',
    warna_tombol_latar: 'rgba(255,255,255,0.08)',
    warna_tombol_teks: '#FFFFFF',
    warna_tombol_border: 'rgba(255,255,255,0.2)',
    font: 'Inter',
    border_radius_tombol: '0.75rem',
    gaya_tombol: 'glass',
    backdrop_blur: true,
  },
  {
    kode: 'retro-wave',
    nama: 'Retro Wave',
    deskripsi: 'Synthwave 80s, gradien pink-ungu neon, retro aesthetic',
    latar: 'linear-gradient(180deg, #0D0221, #1A0536)',
    warna_primer: '#FF71CE',
    warna_teks: '#FFFFFF',
    warna_teks_sekunder: '#B388FF',
    warna_tombol_latar: 'rgba(255, 113, 206, 0.1)',
    warna_tombol_teks: '#FF71CE',
    warna_tombol_border: '#FF71CE',
    font: 'Orbitron',
    border_radius_tombol: '0.25rem',
    gaya_tombol: 'outline',
  },
  {
    kode: 'earth-tone',
    nama: 'Earth Tone',
    deskripsi: 'Warna tanah hangat, cokelat & krem, cocok untuk kreator lifestyle',
    latar: '#F5EFE6',
    warna_primer: '#8B5E3C',
    warna_teks: '#3D1F00',
    warna_teks_sekunder: '#7A5C42',
    warna_tombol_latar: '#EDE0D4',
    warna_tombol_teks: '#5C3D1E',
    warna_tombol_border: '#C4A882',
    font: 'Playfair Display',
    border_radius_tombol: '0.5rem',
    gaya_tombol: 'solid',
  },
  {
    kode: 'arctic',
    nama: 'Arctic',
    deskripsi: 'Putih biru es, bersih & minimalis, cocok untuk tech & startup',
    latar: 'linear-gradient(180deg, #E8F4FD, #FFFFFF)',
    warna_primer: '#0077B6',
    warna_teks: '#03045E',
    warna_teks_sekunder: '#4895EF',
    warna_tombol_latar: '#FFFFFF',
    warna_tombol_teks: '#0077B6',
    warna_tombol_border: '#90E0EF',
    font: 'DM Sans',
    border_radius_tombol: '9999px',
    gaya_tombol: 'outline',
  },
  {
    kode: 'monochrome-bold',
    nama: 'Monochrome Bold',
    deskripsi: 'Hitam putih bold, tipografi besar, editorial modern',
    latar: '#FFFFFF',
    warna_primer: '#000000',
    warna_teks: '#000000',
    warna_teks_sekunder: '#555555',
    warna_tombol_latar: '#000000',
    warna_tombol_teks: '#FFFFFF',
    warna_tombol_border: '#000000',
    font: 'Syne',
    border_radius_tombol: '0.375rem',
    gaya_tombol: 'solid',
  },
];
```

---

## DARK MODE & RESPONSIVITAS

### Aturan Dark Mode

- SEMUA komponen wajib menggunakan class Tailwind `dark:` untuk warna, background, border, dan teks
- Gunakan komponen toggle dark mode yang sudah ada di project (jangan buat baru)
- Contoh pattern wajib:

```tsx
// Contoh class dark mode yang wajib dipakai
<div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
  <p className="text-zinc-900 dark:text-zinc-100">Judul</p>
  <p className="text-zinc-500 dark:text-zinc-400">Deskripsi</p>
</div>

// Kartu
<div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">

// Tombol primer
<button className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300">

// Input
<input className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500">
```

### Aturan Responsivitas

- Mobile-first: default class untuk mobile, gunakan `sm:`, `md:`, `lg:` untuk breakpoint lebih besar
- Grid daftar kartu: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Layout dua kolom (editor + preview): `flex-col lg:flex-row` — di mobile preview muncul di bawah
- Padding halaman: `px-4 sm:px-6 lg:px-8 py-6`
- Gap antar elemen: gunakan `gap-4 sm:gap-6`

---

## ATURAN CLEAN CODE (WAJIB)

### Komponen
- Satu komponen maksimal 200 baris. Lebih dari itu HARUS dipecah menjadi sub-komponen.
- Pisahkan logic dari tampilan: business logic di custom hooks (`useShortLink`, `useQrCodeBuilder`, `useLinktreeEditor`), bukan di dalam JSX langsung.
- Beri nama custom hook dengan prefix `use`: `useDaftarShortLink`, `useBuilderQrCode`, `useEditorLinktree`.
- Komponen preview (`PreviewQrCode`, `PreviewLinktree`) menerima data via props, tidak langsung memanggil API.

### TypeScript
- Dilarang `any`. Selalu buat `interface` atau `type` yang eksplisit.
- Semua props komponen wajib bertipe dengan `interface Props`.
- Definisikan semua tipe di `/types/links.ts`.
- Gunakan `z.infer<typeof schema>` untuk tipe form, jangan duplikasi.

### API Route (Next.js)
- Setiap endpoint wajib validasi body/query dengan Zod sebelum diproses.
- Pisahkan service layer: `/lib/services/shortLinkService.ts`, `/lib/services/qrCodeService.ts`, `/lib/services/linktreeService.ts`.
- Semua error handling menggunakan try-catch dengan pesan error yang jelas.
- HTTP status code yang tepat: 200, 201, 400, 401, 404, 409 (slug sudah dipakai), 500.

### Database (Prisma)
- DILARANG `prisma.model.delete()` — selalu soft delete.
- Query data aktif SELALU filter `dihapus_pada: null`.
- Gunakan `prisma.$transaction()` untuk operasi multi-tabel.

---

## KONVENSI PENAMAAN

| Entitas              | Konvensi             | Contoh                                    |
|----------------------|----------------------|-------------------------------------------|
| Komponen React       | PascalCase           | KartuShortLink, PanelKustomQr             |
| Custom Hooks         | camelCase + use      | useDaftarShortLink, useBuilderQrCode      |
| Handler/Fungsi       | camelCase + verb     | handleBuatQr, handleSalinLink             |
| Konstanta            | UPPER_SNAKE_CASE     | DAFTAR_TEMA, GAYA_TITIK_QR               |
| File komponen        | PascalCase.tsx       | FormQrCode.tsx, ModalTambahLink.tsx       |
| File utility         | camelCase.ts         | generateKodeUnik.ts, formatAnalitik.ts   |
| API Route folder     | kebab-case           | /api/links/short-link/[id]/route.ts       |
| Tabel database       | prefix + snake_case  | m_short_link, c_klik_linktree             |

---

## URUTAN PENGERJAAN (PRIORITAS)

### Sprint 1 — Fondasi (HARUS SELESAI DULU)
1. Buat skema Prisma semua tabel (`m_short_link`, `c_klik_short_link`, `m_qr_code`, `m_linktree`, `c_link_linktree`, `c_klik_linktree`) + jalankan migrasi
2. Buat file `/lib/validations/links.ts` dengan semua Zod schema
3. Buat file `/types/links.ts` dengan semua interface TypeScript
4. Setup `linksApi.ts` (RTK Query) dan daftarkan ke Redux store
5. Buat API route redirect: `/app/api/redirect/[kode]/route.ts` (handler redirect + catat klik)

### Sprint 2 — Modul Short Link
6. Halaman daftar short link (`/short-link/page.tsx`) + semua sub-komponen
7. Modal buat short link (`ModalBuatShortLink.tsx`)
8. Modal edit short link (`ModalEditShortLink.tsx`)
9. Halaman detail analitik (`/short-link/[kode]/page.tsx`) + grafik klik
10. Toggle aktif/nonaktif, tombol salin, konfirmasi hapus

### Sprint 3 — Modul QR Code
11. Halaman daftar QR Code (`/qr-code/page.tsx`) + `KartuQrCode.tsx`
12. Halaman buat QR Code (`/qr-code/create/page.tsx`) — layout dua kolom
13. `PanelKustomQr.tsx` — semua tab kustomisasi (konten, titik, sudut, logo, opsi)
14. `PreviewQrCode.tsx` — preview real-time dengan debounce
15. `InputColorPicker.tsx` — wrapper react-colorful
16. Fitur download PNG / SVG

### Sprint 4 — Modul Linktree
17. Definisikan 15 tema di `/lib/tema-linktree.ts`
18. Halaman daftar linktree (`/linktree/page.tsx`) + `KartuLinktree.tsx`
19. Halaman buat linktree (`/linktree/create/page.tsx`) — layout dua kolom
20. `FormLinktree.tsx` — form konfigurasi profil, tema, warna, SEO
21. `PreviewLinktree.tsx` — preview mobile real-time
22. `ModalTambahLink.tsx` + `ModalEditLink.tsx` + drag-and-drop reorder
23. `ModalPilihTema.tsx` — grid semua tema dengan preview
24. Halaman publik linktree (`/app/[slug]/page.tsx`) — SSR, no auth, semua 15 tema
25. Halaman edit linktree (`/linktree/[slug]/edit/page.tsx`)

---

## CATATAN PENTING UNTUK AI AGENT

1. Selalu ikuti struktur folder yang sudah ada di project sebelum membuat file baru. Cek dulu file-file existing sebagai referensi pola komponen, hook, dan CRUD.

2. Halaman publik linktree (`/app/[slug]/page.tsx`) TIDAK menggunakan layout aplikasi (tidak ada sidebar, tidak ada navbar app). Buat layout tersendiri yang bersih hanya untuk halaman publik ini.

3. Komponen `PreviewQrCode.tsx` dan `PreviewLinktree.tsx` adalah komponen "dumb" yang hanya menerima props. Semua logic state ada di halaman parent atau custom hook.

4. Untuk kustomisasi QR Code, gunakan `qrcode.react` untuk preview di browser. Untuk generate file download (PNG resolusi tinggi, SVG), gunakan library `qrcode` di server (API route) agar kualitas terjaga.

5. Tema linktree didefinisikan sebagai objek TypeScript di `/lib/tema-linktree.ts`, BUKAN di database. Ini agar tema bisa diupdate tanpa migrasi DB. Field `tema` di tabel `m_linktree` menyimpan `kode` tema (string), lalu frontend lookup ke array `DAFTAR_TEMA`.

6. Semua warna di seluruh aplikasi (bukan halaman publik linktree) WAJIB punya class `dark:`. Cek setiap elemen baru yang dibuat sudah memiliki pasangan dark mode.

7. Untuk redirect short link, route `/api/redirect/[kode]` harus: (a) cari short link by kode, (b) cek aktif & belum expired, (c) catat klik ke `c_klik_short_link` (async, jangan blokir redirect), (d) return redirect 302 ke `url_asli`.

8. Slug linktree harus di-validasi keunikannya secara real-time saat user mengetik (debounce 500ms via `useCekSlugTersediaQuery`). Tampilkan indikator tersedia/tidak tersedia di bawah input slug.

9. Untuk ikon di item link linktree, simpan nama ikon sebagai string (contoh: `"FaInstagram"`, `"SiTiktok"`) di database, lalu di frontend lakukan dynamic import atau mapping dari `react-icons` untuk render ikon-nya.

10. Fitur drag-and-drop reorder link di linktree menggunakan `@dnd-kit/core` + `@dnd-kit/sortable`. Setelah reorder, panggil `useUrutanUlangLinkMutation` untuk simpan urutan baru ke DB (update field `urutan` di `c_link_linktree`).