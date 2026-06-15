# Task — Sistem Berita Karang Taruna

## Phase 1 — Setup & API Layer
- [/] Install TipTap packages
- [ ] Buat `features/api/beritaApi.ts`
- [ ] Register `beritaApi` ke Redux store (`lib/redux/store.ts`)

## Phase 2 — TipTap Editor Component
- [ ] Buat `components/organisms/editors/TipTapEditor.tsx` (full-featured)

## Phase 3 — Modals CRUD Berita
- [ ] `components/organisms/modals/berita/BeritaFormModal.tsx` (Tab: Konten/Cover/SEO, TipTap)
- [ ] `components/organisms/modals/berita/BeritaDeleteModal.tsx`
- [ ] `components/organisms/modals/berita/KategoriFormModal.tsx`
- [ ] `components/organisms/modals/berita/TagFormModal.tsx`

## Phase 4 — Admin Dashboard Tables & Pages
- [ ] `components/organisms/tables/BeritaTable.tsx`
- [ ] `components/organisms/tables/KategoriBeritaTable.tsx`
- [ ] `components/organisms/tables/TagBeritaTable.tsx`
- [ ] `app/(dashboard)/dashboard/(berita)/berita/page.tsx`
- [ ] `app/(dashboard)/dashboard/(berita)/berita/kategori/page.tsx`
- [ ] `app/(dashboard)/dashboard/(berita)/berita/tag/page.tsx`

## Phase 5 — Portal Publik
- [ ] Refactor `pages/NewsPage.tsx` (premium design)
- [ ] Buat `pages/NewsDetailPage.tsx`
- [ ] `app/berita/page.tsx` (route)
- [ ] `app/berita/[slug]/page.tsx` (route)
