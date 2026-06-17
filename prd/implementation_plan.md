# Dashboard Sosial Media — Implementation Plan

Menambahkan fitur Dashboard Sosial Media ke aplikasi Karang Taruna, memungkinkan pengelolaan 5 platform (TikTok, Facebook, Instagram, WhatsApp, Twitter) dari satu dasbor terpusat.

---

## User Review Required

> [!IMPORTANT]
> **OAuth Flow**: PRD menyebutkan redirect OAuth 2.0 ke masing-masing platform. Implementasi aktual OAuth membutuhkan Client ID/Secret dari setiap platform. Apakah saat ini cukup membuat **mock/placeholder** untuk OAuth flow, atau sudah tersedia credential API dari platform?

> [!IMPORTANT]
> **Background Job**: PRD menyebutkan background job untuk jadwal posting dan sinkronisasi analitik harian. Apakah project sudah memiliki infrastruktur cron job (misalnya dengan `node-cron`, external scheduler, atau Vercel cron)? Atau perlu di-setup dari awal?

> [!WARNING]
> **Relasi `m_analitik`**: Di PRD, model `m_analitik` memiliki `akun_id` yang berelasi ke `m_akun_sosmed`, tetapi model `m_akun_sosmed` belum punya field `analitik m_analitik[]`. Saya akan menambahkan relasi tersebut secara otomatis.

## Open Questions

1. **WhatsApp Business Cloud API**: Apakah sudah ada akun WhatsApp Business API atau cukup placeholder dulu?
2. **Export CSV/Excel**: Apakah ada preferensi library tertentu untuk export? Saya akan menggunakan `xlsx` (SheetJS) sesuai pola umum Next.js.
3. **Polling vs WebSocket**: PRD menyebutkan polling 30 detik untuk chat. Apakah cukup polling, atau ada rencana migrasi ke WebSocket?

---

## Proposed Changes

Perubahan dikelompokkan per layer, mengikuti arsitektur project yang sudah ada.

---

### Prisma Schema (Database Layer)

Menambahkan 1 file schema baru yang menampung semua model sosial media. Mengikuti pola file-per-domain seperti [event.prisma](file:///d:/PROGRAMMING/Karang%20Taruna%20Mojosongo/karangtaruna_mojosongo/prisma/schema/event.prisma), [keuangan.prisma](file:///d:/PROGRAMMING/Karang%20Taruna%20Mojosongo/karangtaruna_mojosongo/prisma/schema/keuangan.prisma).

#### [NEW] [sosial-media.prisma](file:///d:/PROGRAMMING/Karang%20Taruna%20Mojosongo/karangtaruna_mojosongo/prisma/schema/sosial-media.prisma)

Berisi 8 model sesuai PRD:

| Model | Prefix | Deskripsi |
|---|---|---|
| `m_platform` | master | 5 platform sosmed |
| `m_akun_sosmed` | master | Akun terhubung per platform |
| `m_konten` | master | Postingan/konten |
| `c_media_konten` | child | File media lampiran konten |
| `c_jadwal_konten` | child | Detail jadwal posting |
| `m_chat` | master | Pesan masuk dari semua platform |
| `c_balasan_chat` | child | Balasan pesan chat |
| `m_analitik` | master | Snapshot analitik harian |
| `r_konten_platform` | pivot | Relasi konten → platform |

Semua model mengikuti konvensi wajib:
- 3 field audit: `dibuat_pada`, `diperbarui_pada`, `dihapus_pada`
- Relasi yang benar antar model
- `m_akun_sosmed` ditambahkan relasi `analitik m_analitik[]` yang belum ada di PRD

**Setelah file dibuat**: Jalankan `npx prisma generate` dan `npx prisma db push` / `npx prisma migrate dev`.

**Seed data**: Buat script seed untuk `m_platform` (5 platform: tiktok, facebook, instagram, whatsapp, twitter).

---

### Zod Validation Schema

Mengikuti pola penamaan `{feature}.schema.ts` seperti [rapat.schema.ts](file:///d:/PROGRAMMING/Karang%20Taruna%20Mojosongo/karangtaruna_mojosongo/lib/validations/rapat.schema.ts).

#### [NEW] [sosial-media.schema.ts](file:///d:/PROGRAMMING/Karang%20Taruna%20Mojosongo/karangtaruna_mojosongo/lib/validations/sosial-media.schema.ts)

Berisi:
- **Konstanta**: `STATUS_AKUN`, `STATUS_KONTEN`, `TIPE_KONTEN`, `STATUS_CHAT`, `STATUS_JOB`
- **Schemas**:
  - `schemaHubungkanAkun` — validasi form koneksi akun
  - `schemaBuatKonten` — validasi form buat konten baru
  - `schemaUpdateKonten` — partial dari schemaBuatKonten
  - `schemaBalasChat` — validasi form balas chat
  - `schemaFilterKonten` — validasi query params filter konten
  - `schemaFilterChat` — validasi query params filter chat
  - `schemaFilterAnalitik` — validasi query params filter analitik
- **Exported types**: `FormHubungkanAkun`, `FormBuatKonten`, `FormBalasChat`, dll (via `z.infer`)

---

### RTK Query API (Features Layer)

Mengikuti pola `createApi` terpisah per fitur seperti [eproposalApi.ts](file:///d:/PROGRAMMING/Karang%20Taruna%20Mojosongo/karangtaruna_mojosongo/features/api/eproposalApi.ts) — menggunakan `fetchBaseQuery` dengan `baseUrl: "/api"` dan `credentials: "include"`.

#### [NEW] [sosialMediaApi.ts](file:///d:/PROGRAMMING/Karang%20Taruna%20Mojosongo/karangtaruna_mojosongo/features/api/sosialMediaApi.ts)

```typescript
export const sosialMediaApi = createApi({
  reducerPath: "sosialMediaApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api", credentials: "include" }),
  tagTypes: ["Platform", "AkunSosmed", "Konten", "Chat", "Analitik"],
  endpoints: (builder) => ({
    // Platform
    getDaftarPlatform: builder.query<...>({...}),
    
    // Akun
    getAkunByPlatform: builder.query<...>({...}),
    hubungkanAkun: builder.mutation<...>({...}),
    putuskanAkun: builder.mutation<...>({...}),
    perbaruiToken: builder.mutation<...>({...}),
    
    // Konten
    getDaftarKonten: builder.query<...>({...}),
    getKontenById: builder.query<...>({...}),
    buatKonten: builder.mutation<...>({...}),
    updateKonten: builder.mutation<...>({...}),
    hapusKonten: builder.mutation<...>({...}),
    publishKonten: builder.mutation<...>({...}),
    
    // Chat
    getDaftarChat: builder.query<...>({...}), // pollingInterval: 30000
    getChatById: builder.query<...>({...}),
    balasChat: builder.mutation<...>({...}),
    tandaiDibaca: builder.mutation<...>({...}),
    getUnreadCount: builder.query<...>({...}),
    
    // Analitik
    getAnalitik: builder.query<...>({...}),
    getTopKonten: builder.query<...>({...}),
    exportAnalitik: builder.mutation<...>({...}),
  }),
});
```

Semua endpoint menggunakan `providesTags` dan `invalidatesTags` yang tepat.

Exported hooks: `useGetDaftarPlatformQuery`, `useHubungkanAkunMutation`, `useGetDaftarKontenQuery`, dll.

---

### Redux Store Registration

#### [MODIFY] [store.ts](file:///d:/PROGRAMMING/Karang%20Taruna%20Mojosongo/karangtaruna_mojosongo/lib/redux/store.ts)

Tambahkan import dan registrasi `sosialMediaApi`:

```diff
+import { sosialMediaApi } from "@/features/api/sosialMediaApi";

 export const store = configureStore({
     reducer: {
         ...
+        [sosialMediaApi.reducerPath]: sosialMediaApi.reducer,
     },
     middleware: (getDefaultMiddleware) =>
         getDefaultMiddleware().concat(
             ...
+            sosialMediaApi.middleware,
         ),
 });
```

---

### API Routes (Next.js App Router)

Mengikuti pola handler seperti [eproposal/route.ts](file:///d:/PROGRAMMING/Karang%20Taruna%20Mojosongo/karangtaruna_mojosongo/app/api/eproposal/route.ts) — menggunakan `withAuth`, `prisma`, `successResponse`, `errorResponse`, `handleApiError`. Semua body divalidasi dengan Zod.

#### Modul Platform

##### [NEW] `app/api/sosial-media/platform/route.ts`
- `GET` — Daftar semua platform aktif (`dihapus_pada: null`)

---

#### Modul Akun

##### [NEW] `app/api/sosial-media/akun/route.ts`
- `GET` — Daftar akun berdasarkan `platform_id` (query param), filter `dihapus_pada: null`
- `POST` — Hubungkan akun baru, validasi body dengan `schemaHubungkanAkun`

##### [NEW] `app/api/sosial-media/akun/[id]/route.ts`
- `PUT` — Update akun (perbarui token)
- `DELETE` — Soft delete akun (`dihapus_pada: new Date()`)

---

#### Modul Konten

##### [NEW] `app/api/sosial-media/konten/route.ts`
- `GET` — Daftar konten dengan filter (status, akun_id, tipe_konten), include `media`, `jadwal`, `platform`
- `POST` — Buat konten baru, validasi body dengan `schemaBuatKonten`, buat relasi `r_konten_platform` dan `c_media_konten` dalam `$transaction`

##### [NEW] `app/api/sosial-media/konten/[id]/route.ts`
- `GET` — Detail konten by ID
- `PUT` — Update konten (hanya draft/scheduled), validasi dengan `schemaUpdateKonten`
- `DELETE` — Soft delete konten + media + jadwal dalam `$transaction`

##### [NEW] `app/api/sosial-media/konten/[id]/publish/route.ts`
- `POST` — Publish konten sekarang (ubah status draft → published)

---

#### Modul Chat

##### [NEW] `app/api/sosial-media/chat/route.ts`
- `GET` — Daftar chat dengan filter (platform via akun_id, status), include `akun.platform`, `balasan`

##### [NEW] `app/api/sosial-media/chat/[id]/route.ts`
- `GET` — Detail chat + tandai `sudah_dibaca: true`
- `PUT` — Update status chat (arsipkan)

##### [NEW] `app/api/sosial-media/chat/balas/route.ts`
- `POST` — Kirim balasan, validasi body dengan `schemaBalasChat`, buat `c_balasan_chat`

##### [NEW] `app/api/sosial-media/chat/unread/route.ts`
- `GET` — Hitung jumlah chat belum dibaca (`sudah_dibaca: false`)

---

#### Modul Analitik

##### [NEW] `app/api/sosial-media/analitik/route.ts`
- `GET` — Data analitik dengan filter (akun_id, periode)

##### [NEW] `app/api/sosial-media/analitik/top-konten/route.ts`
- `GET` — Top konten berdasarkan engagement (likes + komentar + share), sortable

##### [NEW] `app/api/sosial-media/analitik/export/route.ts`
- `POST` — Export data analitik ke CSV/Excel

---

### Components — Modals

Mengikuti pola [KasFormModal.tsx](file:///d:/PROGRAMMING/Karang%20Taruna%20Mojosongo/karangtaruna_mojosongo/components/organisms/modals/keuangan/KasFormModal.tsx) — menggunakan Dialog dari shadcn/ui, react-hook-form + zodResolver, toast dari sonner.

#### [NEW] `components/organisms/modals/sosial-media/konten/ModalKonfirmasiHapusKonten.tsx`
- Dialog konfirmasi soft delete konten
- Props: `isOpen`, `onOpenChange`, `onConfirm`, `kontenJudul`

#### [NEW] `components/organisms/modals/sosial-media/konten/ModalPublishSekarang.tsx`
- Dialog konfirmasi publish sekarang
- Preview platform tujuan, confirm button

#### [NEW] `components/organisms/modals/sosial-media/chat/ModalDetailPercakapan.tsx`
- Dialog riwayat percakapan (sender info + daftar pesan + balasan)
- Auto-tandai dibaca saat dibuka

#### [NEW] `components/organisms/modals/sosial-media/chat/ModalBalasChat.tsx`
- Dialog form balas chat
- Form field: `isi_balasan` (Textarea), validasi `schemaBalasChat`
- Tampilkan pesan asli sebagai konteks

#### [NEW] `components/organisms/modals/sosial-media/login/ModalPutuskanAkun.tsx`
- Dialog konfirmasi putuskan/disconnect akun
- Warning text, confirm soft delete

#### [NEW] `components/organisms/modals/sosial-media/login/ModalHubungkanAkun.tsx`
- Dialog form hubungkan akun baru
- Form field: platform (Combobox), nama_akun, username, access_token, refresh_token, token_expires_at
- Validasi `schemaHubungkanAkun`

---

### Components — Forms (Page Components)

Mengikuti pola [BeritaForm.tsx](file:///d:/PROGRAMMING/Karang%20Taruna%20Mojosongo/karangtaruna_mojosongo/components/organisms/forms/BeritaForm.tsx) — form dengan banyak field dibuat sebagai page component.

#### [NEW] `components/organisms/forms/sosial-media/FormKonten.tsx`
- Form buat/edit konten (>5 fields)
- Fields: akun (Combobox), tipe_konten (Combobox), caption (Textarea), platform tujuan (multi-select Combobox), media upload (drag & drop), toggle jadwal/sekarang, datetime picker
- Validasi `schemaBuatKonten`
- Preview per platform

#### [NEW] `components/organisms/forms/sosial-media/FormJadwalKonten.tsx`
- Form jadwal posting (sub-form dari FormKonten)
- Fields: waktu_posting (datetime picker)
- Terintegrasi ke form konten utama

---

### Dashboard Pages (App Router)

Semua halaman di bawah `app/(dashboard)/dashboard/(sosial-media)/`. Folder per-platform sudah ada (facebook, instagram, tiktok, twitter, whatsapp), masing-masing sudah punya subfolder `analytic/`, `chat/`, `content/`, `login/`.

> [!NOTE]
> Karena setiap platform memiliki halaman yang identik (hanya beda `platform_id`), kita akan membuat **shared components** yang menerima `platformSlug` sebagai prop. Setiap `page.tsx` hanya wrapping shared component dengan slug yang sesuai.

#### Per Platform (×5: facebook, instagram, tiktok, twitter, whatsapp)

##### [NEW] `app/(dashboard)/dashboard/(sosial-media)/{platform}/login/page.tsx`
- Import & render shared `LoginPage` component dengan `platformSlug`
- Tampilkan status akun, tombol hubungkan/putuskan/perbarui token

##### [NEW] `app/(dashboard)/dashboard/(sosial-media)/{platform}/chat/page.tsx`
- Import & render shared `ChatPage` component
- Unified inbox filtered by platform
- Filter status, search bar, badge unread

##### [NEW] `app/(dashboard)/dashboard/(sosial-media)/{platform}/content/page.tsx`
- Import & render shared `ContentPage` component
- Tab: Semua | Draft | Terjadwal | Terposting | Gagal
- Kalender view, tombol buat konten baru

##### [NEW] `app/(dashboard)/dashboard/(sosial-media)/{platform}/analytic/page.tsx`
- Import & render shared `AnalyticPage` component
- Summary cards, grafik tren, tabel top konten, export

#### Shared Components untuk Pages

##### [NEW] `components/organisms/sosial-media/LoginPage.tsx`
- Shared component halaman login/koneksi akun

##### [NEW] `components/organisms/sosial-media/ChatPage.tsx`
- Shared component halaman unified inbox

##### [NEW] `components/organisms/sosial-media/ContentPage.tsx`
- Shared component halaman manajemen konten

##### [NEW] `components/organisms/sosial-media/AnalyticPage.tsx`
- Shared component halaman analitik

##### [NEW] `components/organisms/sosial-media/KalenderKonten.tsx`
- Komponen kalender view untuk konten terjadwal

##### [NEW] `components/organisms/sosial-media/GrafikAnalitik.tsx`
- Komponen grafik tren engagement (line/bar chart)

##### [NEW] `components/organisms/sosial-media/KartuSummary.tsx`
- Komponen summary cards (followers, reach, impressions, engagement)

##### [NEW] `components/organisms/sosial-media/TabelTopKonten.tsx`
- Komponen tabel top konten sortable

---

### TypeScript Types

#### [NEW] `lib/types/sosial-media.types.ts`
- Interface: `Platform`, `AkunSosmed`, `Konten`, `MediaKonten`, `JadwalKonten`, `Chat`, `BalasanChat`, `Analitik`, `KontenPlatform`
- Filter types: `KontenFilter`, `ChatFilter`, `AnalitikFilter`
- Response wrappers: `ApiResponse<T>`, `PaginatedResponse<T>`

---

### Seed Data

#### [NEW] `prisma/seed-platform.ts`
- Seed 5 platform ke tabel `m_platform`:

| nama | slug | aktif |
|---|---|---|
| TikTok | tiktok | true |
| Facebook | facebook | true |
| Instagram | instagram | true |
| WhatsApp | whatsapp | true |
| Twitter | twitter | true |

---

## Verification Plan

### Automated Tests
```bash
npx prisma generate
npx prisma db push
npx prisma studio  # Verifikasi tabel & relasi
```

### Manual Verification
1. **Prisma**: Verifikasi semua model terbuat dengan `npx prisma studio`
2. **API Routes**: Test setiap endpoint via browser/Postman
3. **Redux Store**: Verifikasi `sosialMediaApi` terdaftar di store tanpa error
4. **Halaman**: Navigasi ke setiap halaman platform, pastikan render tanpa error
5. **Build**: `npm run build` harus sukses tanpa TypeScript error

---

## Urutan Pengerjaan (Sprint-based)

### Sprint 1 — Fondasi
1. `prisma/schema/sosial-media.prisma` — Schema database
2. `prisma/seed-platform.ts` — Seed data platform
3. `lib/types/sosial-media.types.ts` — TypeScript types
4. `lib/validations/sosial-media.schema.ts` — Zod schemas
5. `features/api/sosialMediaApi.ts` — RTK Query API
6. `lib/redux/store.ts` — Registrasi ke store

### Sprint 2 — Modul Login & Chat
7. API routes: `sosial-media/platform/`, `sosial-media/akun/`
8. API routes: `sosial-media/chat/`, `sosial-media/chat/balas/`, `sosial-media/chat/unread/`
9. Modals: `ModalHubungkanAkun`, `ModalPutuskanAkun`, `ModalBalasChat`, `ModalDetailPercakapan`
10. Shared components: `LoginPage`, `ChatPage`
11. Page files: `login/page.tsx` × 5, `chat/page.tsx` × 5

### Sprint 3 — Modul Content
12. API routes: `sosial-media/konten/`, `sosial-media/konten/[id]/`, `sosial-media/konten/[id]/publish/`
13. Forms: `FormKonten`, `FormJadwalKonten`
14. Modals: `ModalKonfirmasiHapusKonten`, `ModalPublishSekarang`
15. Shared components: `ContentPage`, `KalenderKonten`
16. Page files: `content/page.tsx` × 5

### Sprint 4 — Analitik & Polish
17. API routes: `sosial-media/analitik/`, `sosial-media/analitik/top-konten/`, `sosial-media/analitik/export/`
18. Shared components: `AnalyticPage`, `GrafikAnalitik`, `KartuSummary`, `TabelTopKonten`
19. Page files: `analytic/page.tsx` × 5
20. Polish: responsiveness, loading states, error handling
