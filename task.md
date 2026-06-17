# Task — Buku Kas & Transparansi Anggaran

## Phase 1 — Database Schema & Migration
- [ ] Tambahkan model `m_kas` ke `prisma/schema/keuangan.prisma`
- [ ] Tambahkan relasi kas ke `prisma/schema/user.prisma`
- [ ] Jalankan `npx prisma db push` dan `npx prisma generate`

## Phase 2 — Refactor API (Hapus Elasticsearch)
- [ ] Refactor `app/api/anggaran/route.ts` ke Prisma + Redis
- [ ] Refactor `app/api/transaksi-keuangan/route.ts` ke Prisma
- [ ] Refactor `app/api/transaksi-keuangan/[id]/route.ts` ke Prisma

## Phase 3 — Backend API Routes (Buku Kas & Publik)
- [ ] Buat validation schemas di `lib/validations/keuangan.schema.ts`
- [ ] Buat API endpoint Kas (`app/api/keuangan/kas/route.ts` & `[id]/route.ts`)
- [ ] Buat API endpoint Kas Approve (`app/api/keuangan/kas/[id]/approve/route.ts`)
- [ ] Buat API endpoint Kas Public (`app/api/keuangan/kas/public/route.ts`)
- [ ] Buat API endpoint Anggaran Public (`app/api/anggaran/public/route.ts`)

## Phase 4 — State Management (Redux RTK Query)
- [ ] Update `features/api/keuanganApi.ts` dengan query/mutation Kas & Public

## Phase 5 — Modals Components
- [ ] Buat `components/organisms/modals/keuangan/KasFormModal.tsx`
- [ ] Buat `components/organisms/modals/keuangan/KasDeleteModal.tsx`
- [ ] Buat `components/organisms/modals/keuangan/KasApproveModal.tsx`

## Phase 6 — Admin Dashboard & Public Pages
- [ ] Buat admin page `app/(dashboard)/dashboard/(alat)/keuangan/page.tsx`
- [ ] Update navigasi sub-items di `components/organisms/Sidebar.tsx`
- [ ] Buat public page `app/anggaran/page.tsx`
- [ ] Verifikasi seluruh alur & compile check
