# Halaman Berita — Implementasi Lengkap

## Ringkasan

Membangun sistem berita lengkap yang mencakup:
1. **Portal Publik** — Halaman berita minimalist, modern, premium dengan desain seperti referensi
2. **Admin Dashboard CRUD** — Manajemen berita, kategori, dan tag di `/dashboard/berita`
3. **RTK Query API Layer** — `beritaApi.ts` mengikuti pola `eventApi.ts`
4. **Modals CRUD** — Form tambah/edit berita, kategori, dan tag

Semua API sudah ada (`/api/berita`, `/api/kategori-berita`, `/api/tag-berita`). Yang perlu dibuat adalah **frontend layer**.

---

## Struktur File yang Akan Dibuat

### 1. RTK Query API (`features/api/`)

#### [NEW] `beritaApi.ts`
- `getBeritaList` — GET `/api/berita` (admin CMS, semua status, paginated, filter)
- `getBeritaById` — GET `/api/berita/[id]` (detail by ID, untuk form edit)
- `createBerita` — POST `/api/berita`
- `updateBerita` — PATCH `/api/berita/[id]`
- `deleteBerita` — DELETE `/api/berita/[id]`
- `publishBerita` — PATCH `/api/berita/[id]/publish` (ubah status)
- `getBeritaTerbaru` — GET `/api/berita/terbaru` (publik, paginated)
- `getBeritaTrending` — GET `/api/berita/trending` (publik)
- `getBeritaTop` — GET `/api/berita/top` (publik)
- `getBeritaBySlug` — GET `/api/berita/slug/[slug]` (publik, detail)
- `getBeritaByKategori` — GET `/api/berita/kategori/[slug]` (publik)
- `getKategoriBerita` — GET `/api/kategori-berita` (publik & admin)
- `createKategori` — POST `/api/kategori-berita`
- `getTagBerita` — GET `/api/tag-berita` (dropdown & admin)
- `createTag` — POST `/api/tag-berita`

#### [MODIFY] `lib/redux/store.ts`
- Tambahkan `beritaApi` ke store

---

### 2. Halaman Publik — Portal Berita

#### [NEW] `app/berita/page.tsx`
Route publik `/berita` — rendering `NewsPage` yang sudah direfaktor

#### [NEW] `app/berita/[slug]/page.tsx`  
Route publik `/berita/[slug]` — halaman detail artikel

#### [MODIFY] `pages/NewsPage.tsx`
Desain premium lengkap:
- **Hero Featured** — Berita unggulan dengan gambar besar, overlay gradient, badge kategori
- **Breaking News ticker** — animasi horizontal scroll
- **Berita Terbaru** — Grid card layout dengan pagination infinite scroll
- **Sidebar Kanan** — Berita terpopuler + Kategori grid
- **Filter kategori** — Tab navigasi kategori
- **Search** — Live search dengan debounce
- Semua data dari RTK Query hooks

#### [NEW] `pages/NewsDetailPage.tsx`
Halaman detail artikel publik:
- Hero image fullwidth + metadata (penulis, tanggal, kategori, views)
- Konten rendered HTML (`konten_html`)
- Share buttons (social media)
- Berita terkait (same kategori)
- Komentar section (read-only, publik)
- Sidebar: Berita Terpopuler, Kategori

---

### 3. Admin Dashboard CRUD

#### [NEW] `app/(dashboard)/dashboard/(berita)/berita/page.tsx`
Route: `/dashboard/berita`

#### [NEW] `app/(dashboard)/dashboard/(berita)/berita/kategori/page.tsx`
Route: `/dashboard/berita/kategori`

#### [NEW] `app/(dashboard)/dashboard/(berita)/berita/tag/page.tsx`
Route: `/dashboard/berita/tag`

#### [NEW] `components/organisms/tables/BeritaTable.tsx`
Table CRUD berita dengan:
- Kolom: Cover, Judul, Kategori, Status, Penulis, Published At, Views, Aksi
- Filter: status, kategori, search
- Pagination
- Action: Edit, Delete, Publish/Unpublish (quick action)

#### [NEW] `components/organisms/tables/KategoriBeritaTable.tsx`
Table CRUD kategori berita

#### [NEW] `components/organisms/tables/TagBeritaTable.tsx`
Table CRUD tag berita

---

### 4. Modals CRUD Berita

#### [NEW] `components/organisms/modals/berita/BeritaFormModal.tsx`
Form berita (tambah/edit) — extended Dialog (karena konten banyak):
- Tab "Konten": Judul, Sub-judul, Penulis, Editor, Kategori (Select), Tags (multi-select), Textarea konten (plaintext/HTML)
- Tab "Cover": Upload cover image via S3 (`useUploadFileMutation` dari `storageApi`)
- Tab "SEO": slug, seo_title, seo_description, keywords, og_image
- Toggle: `is_featured`, `is_breaking_news`
- Tombol simpan (DRAFT) & Terbitkan (PUBLISHED)

#### [NEW] `components/organisms/modals/berita/BeritaDeleteModal.tsx`
Konfirmasi hapus berita

#### [NEW] `components/organisms/modals/berita/KategoriFormModal.tsx`
Form tambah/edit kategori: nama, slug (auto-gen), deskripsi, warna_hex (color picker), urutan

#### [NEW] `components/organisms/modals/berita/TagFormModal.tsx`
Form tambah/edit tag: nama, slug (auto-gen), deskripsi

---

## Desain Visual (Portal Publik)

### Design Language
- **Warna**: Menggunakan design system yang ada (primary green `#00BC6A`, accent orange `#F57C00`)
- **Font**: `--font-title` (Oswald) untuk heading berita, `--font-body` (Source Serif 4) untuk konten artikel, `--font-ui` (Manrope) untuk UI
- **Style**: Minimalist, glassmorphism subtle, dark/light mode support
- **Animasi**: framer-motion untuk card hover, skeleton loading, page transitions

### Layout Halaman Berita (referensi gambar)
```
┌─────────────────────────────────────────────────┐
│  Navbar                                         │
├──────────────────────────────┬──────────────────┤
│  HERO FEATURED (70%)         │  Sidebar (30%)   │
│  [Gambar besar, overlay]     │  Trending        │
│  Badge | Judul | Meta        │  ─────────────   │
├──────────────────────────────┤  Kategori Grid   │
│  Filter Tabs: [Semua][Kat..]  │                  │
├──────────────────────────────┤  Newsletter CTA  │
│  Grid Berita Terbaru 2 col   │                  │
│  [Card][Card]                │                  │
│  [Card][Card]                │                  │
│  [Load More]                 │                  │
└──────────────────────────────┴──────────────────┘
```

---

## API Endpoints yang Digunakan

| Endpoint | Method | Auth | Digunakan |
|---|---|---|---|
| `/api/berita` | GET | ✅ Admin | Admin CMS list |
| `/api/berita` | POST | ✅ Admin | Create berita |
| `/api/berita/[id]` | GET | ✅ Admin | Edit form data |
| `/api/berita/[id]` | PATCH | ✅ Admin | Update berita |
| `/api/berita/[id]` | DELETE | ✅ Admin | Soft delete |
| `/api/berita/[id]/publish` | PATCH | ✅ Admin | Publish/Archive/Reject |
| `/api/berita/terbaru` | GET | ❌ Publik | Portal listing |
| `/api/berita/trending` | GET | ❌ Publik | Sidebar trending |
| `/api/berita/top` | GET | ❌ Publik | Sidebar top |
| `/api/berita/slug/[slug]` | GET | ❌ Publik | Detail artikel |
| `/api/berita/kategori/[slug]` | GET | ❌ Publik | Filter kategori |
| `/api/kategori-berita` | GET/POST | Mix | Dropdown + Admin |
| `/api/tag-berita` | GET/POST | Mix | Dropdown + Admin |
| S3 External API | POST | API Key | Upload cover image |

---

## Verification Plan

### Manual
1. Portal `/berita` menampilkan berita dari API dengan loading state
2. Klik berita → redirect ke `/berita/[slug]`
3. Dashboard `/dashboard/berita` — CRUD berita berfungsi
4. Upload cover image melalui S3 storage API berjalan
5. Publish/Archive berita mengubah status di tabel
6. Filter kategori & search berfungsi realtime

### Auto
- TypeScript kompilasi tanpa error
- RTK Query hooks terekspos dengan benar dari `beritaApi.ts`
