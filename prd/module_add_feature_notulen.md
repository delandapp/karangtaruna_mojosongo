# PRD — Fitur Manajemen Notulen Rapat
**Versi:** 1.0.0  
**Status:** Draft  
**Tanggal:** 2026-05-28  
**Author:** Product Team  

---

## 1. Ringkasan Eksekutif

Fitur **Manajemen Notulen Rapat** adalah penambahan modul baru pada sistem yang sudah ada, bertujuan untuk mendigitalisasi proses pencatatan, distribusi, dan tindak lanjut hasil rapat secara modern, terstruktur, dan terkelola dengan baik.

Fitur ini mencakup: pembuatan agenda rapat, pencatatan notulen secara *real-time*, manajemen keputusan, tracking tindak lanjut (*action items*), lampiran dokumen, dan riwayat revisi notulen.

---

## 2. Latar Belakang & Tujuan

### 2.1 Masalah yang Diselesaikan
- Notulen rapat masih manual (Word/kertas) dan tidak terstruktur
- Tidak ada tracking tindak lanjut yang jelas dan akuntabel
- Sulitnya distribusi hasil rapat ke seluruh peserta
- Tidak ada riwayat revisi dan persetujuan notulen
- Peserta rapat tidak dapat mengonfirmasi kehadiran secara digital

### 2.2 Tujuan Fitur
- Digitalisasi end-to-end proses rapat: dari agenda → pelaksanaan → notulen → tindak lanjut
- Meningkatkan akuntabilitas tindak lanjut dengan deadline dan PIC yang jelas
- Memberikan visibilitas status notulen (draft → review → final)
- Mendukung ekspor notulen ke PDF/Word resmi

---

## 3. Ruang Lingkup (Scope)

### 3.1 Dalam Scope (In Scope)
- CRUD Rapat (Jadwal, Jenis, Lokasi)
- CRUD Agenda Rapat
- CRUD Notulen (per sesi rapat)
- Manajemen Peserta Rapat & Kehadiran
- Pencatatan Keputusan Rapat
- Manajemen Tindak Lanjut (*Action Items*) dengan deadline & PIC
- Lampiran Notulen (upload file)
- Status Workflow Notulen: `DRAFT → REVIEW → DISETUJUI → FINAL`
- Riwayat Revisi Notulen
- Komentar & Anotasi pada Notulen
- Ekspor PDF / Word
- Notifikasi ke peserta (integrasi tabel `notifikasi` yang sudah ada)

### 3.2 Di Luar Scope (Out of Scope)
- Video conferencing / integrasi Zoom / GMeet
- Fitur voting/polling dalam rapat
- Transkripsi suara otomatis (AI transcription)

---

## 4. User Stories

| # | Sebagai | Saya ingin | Agar |
|---|---------|-----------|------|
| US-01 | Admin/Sekretaris | Membuat jadwal rapat beserta agenda | Peserta siap sebelum rapat |
| US-02 | Sekretaris | Mencatat notulen selama rapat berlangsung | Notulen tersimpan real-time |
| US-03 | Sekretaris | Menambahkan keputusan rapat | Keputusan terdokumentasi resmi |
| US-04 | Sekretaris | Menambahkan tindak lanjut + PIC + deadline | Ada akuntabilitas pasca rapat |
| US-05 | Anggota | Mengonfirmasi kehadiran rapat | Presensi tercatat digital |
| US-06 | PIC Tindak Lanjut | Melihat dan mengupdate status tugas saya | Progres bisa dipantau |
| US-07 | Pimpinan | Menyetujui notulen final | Notulen berkekuatan resmi |
| US-08 | Semua user | Mengekspor notulen ke PDF/Word | Bisa dibagikan ke pihak eksternal |
| US-09 | Admin | Melihat dashboard ringkasan rapat & tindak lanjut | Monitoring menyeluruh |

---

## 5. Arsitektur & Konvensi

### 5.1 Aturan Penamaan (Mengikuti Konvensi Existing)
```
Tabel Master  : m_namatabel
Tabel Child   : c_namatabel
Foreign Key   : m_namatabel_id
File Prisma   : notulen.prisma
```

### 5.2 Stack Teknologi (Mengikuti yang Sudah Ada)
- **ORM:** Prisma (file terpisah: `notulen.prisma`)
- **Backend:** Mengikuti struktur route/controller/service yang sudah ada
- **Auth:** Menggunakan `m_user` yang sudah ada
- **Notifikasi:** Integrasi dengan tabel `notifikasi` yang sudah ada
- **Audit:** Integrasi dengan tabel `log_audit` yang sudah ada

---

## 6. Desain Database — `notulen.prisma`

```prisma
// ============================================================
// FILE: notulen.prisma
// Deskripsi: Schema untuk Manajemen Notulen Rapat
// Konvensi: m_ = master, c_ = child, foreign key = m_table_id
// ============================================================

// ----------------------------------------------------------
// ENUM
// ----------------------------------------------------------

enum StatusRapat {
  TERJADWAL
  BERLANGSUNG
  SELESAI
  DIBATALKAN
  DITUNDA
}

enum StatusNotulen {
  DRAFT
  REVIEW
  DISETUJUI
  FINAL
  DITOLAK
}

enum StatusTindakLanjut {
  BELUM_MULAI
  DALAM_PROSES
  SELESAI
  TERLAMBAT
  DIBATALKAN
}

enum JenisRapat {
  INTERNAL
  EKSTERNAL
  KOORDINASI
  EVALUASI
  DARURAT
  LAINNYA
}

enum StatusKehadiran {
  DIUNDANG
  HADIR
  TIDAK_HADIR
  IZIN
  TERLAMBAT
}

// ----------------------------------------------------------
// MASTER: Jenis/Kategori Rapat
// ----------------------------------------------------------
model m_kategori_rapat {
  id              Int     @id @default(autoincrement())
  nama_kategori   String  @unique
  deskripsi       String?
  warna_hex       String? // Untuk tampilan UI (contoh: "#3B82F6")
  is_aktif        Boolean @default(true)

  rapats          m_rapat[]

  dibuat_pada     DateTime @default(now())
  diperbarui_pada DateTime @updatedAt
}

// ----------------------------------------------------------
// MASTER: Rapat
// ----------------------------------------------------------
model m_rapat {
  id                   Int          @id @default(autoincrement())
  m_kategori_rapat_id  Int?
  m_user_id            Int          // Pembuat rapat (relasi ke m_user)

  judul_rapat          String
  jenis_rapat          JenisRapat   @default(INTERNAL)
  status_rapat         StatusRapat  @default(TERJADWAL)
  deskripsi            String?      @db.Text

  // Waktu & Tempat
  tanggal_mulai        DateTime
  tanggal_selesai      DateTime?
  lokasi               String?
  link_online          String?      // Zoom/GMeet URL
  is_online            Boolean      @default(false)

  // Metadata
  nomor_rapat          String?      @unique // Nomor surat rapat (jika ada)
  is_recurring         Boolean      @default(false)

  // Relasi
  kategori             m_kategori_rapat?   @relation(fields: [m_kategori_rapat_id], references: [id], onDelete: SetNull)
  dibuat_oleh          m_user              @relation("rapat_dibuat", fields: [m_user_id], references: [id])
  agendas              c_agenda_rapat[]
  peserta              c_peserta_rapat[]
  notulen              m_notulen?

  dibuat_pada          DateTime @default(now())
  diperbarui_pada      DateTime @updatedAt

  @@index([m_user_id])
  @@index([m_kategori_rapat_id])
  @@index([status_rapat])
  @@index([tanggal_mulai])
}

// ----------------------------------------------------------
// CHILD: Agenda Rapat (per item agenda)
// ----------------------------------------------------------
model c_agenda_rapat {
  id              Int     @id @default(autoincrement())
  m_rapat_id      Int
  m_user_id       Int?    // PIC agenda (opsional)

  urutan          Int     // Nomor urut agenda
  judul_agenda    String
  deskripsi       String? @db.Text
  durasi_menit    Int?    // Estimasi durasi dalam menit

  // Relasi
  rapat           m_rapat       @relation(fields: [m_rapat_id], references: [id], onDelete: Cascade)
  pic             m_user?       @relation("agenda_pic", fields: [m_user_id], references: [id], onDelete: SetNull)
  poin_bahasan    c_poin_bahasan[]

  dibuat_pada     DateTime @default(now())
  diperbarui_pada DateTime @updatedAt

  @@index([m_rapat_id])
  @@index([m_user_id])
}

// ----------------------------------------------------------
// CHILD: Peserta Rapat
// ----------------------------------------------------------
model c_peserta_rapat {
  id                Int             @id @default(autoincrement())
  m_rapat_id        Int
  m_user_id         Int?            // Null jika tamu eksternal
  
  nama_peserta      String          // Redundan untuk tamu eksternal
  jabatan_peserta   String?
  instansi          String?         // Untuk tamu dari luar
  email             String?
  no_handphone      String?
  
  status_kehadiran  StatusKehadiran @default(DIUNDANG)
  waktu_hadir       DateTime?       // Jam check-in
  catatan_kehadiran String?
  tanda_tangan_url  String?         // URL gambar tanda tangan (opsional)
  is_moderator      Boolean         @default(false)
  is_notulis        Boolean         @default(false)

  // Relasi
  rapat             m_rapat   @relation(fields: [m_rapat_id], references: [id], onDelete: Cascade)
  user              m_user?   @relation("peserta_rapat", fields: [m_user_id], references: [id], onDelete: SetNull)

  dibuat_pada     DateTime @default(now())
  diperbarui_pada DateTime @updatedAt

  @@unique([m_rapat_id, m_user_id])
  @@index([m_rapat_id])
  @@index([m_user_id])
}

// ----------------------------------------------------------
// MASTER: Notulen Rapat (satu notulen per rapat)
// ----------------------------------------------------------
model m_notulen {
  id              Int            @id @default(autoincrement())
  m_rapat_id      Int            @unique
  m_user_id       Int            // Notulis (pembuat notulen)
  m_approver_id   Int?           // Penyetuju notulen

  nomor_notulen   String?        @unique // Nomor dokumen notulen
  status          StatusNotulen  @default(DRAFT)
  
  pembukaan       String?        @db.Text // Kata pembuka notulen
  penutupan       String?        @db.Text // Kata penutup notulen
  kesimpulan_umum String?        @db.Text // Ringkasan keseluruhan
  
  // Waktu approval
  diajukan_pada   DateTime?      // Tanggal diajukan ke reviewer
  disetujui_pada  DateTime?      // Tanggal disetujui
  
  catatan_penolakan String?      @db.Text // Alasan jika ditolak

  // Relasi
  rapat           m_rapat              @relation(fields: [m_rapat_id], references: [id], onDelete: Cascade)
  notulis         m_user               @relation("notulen_dibuat", fields: [m_user_id], references: [id])
  approver        m_user?              @relation("notulen_disetujui", fields: [m_approver_id], references: [id], onDelete: SetNull)
  poin_bahasan    c_poin_bahasan[]
  keputusan       c_keputusan_rapat[]
  tindak_lanjut   c_tindak_lanjut[]
  lampiran        c_lampiran_notulen[]
  komentar        c_komentar_notulen[]
  riwayat_revisi  c_revisi_notulen[]

  dibuat_pada     DateTime @default(now())
  diperbarui_pada DateTime @updatedAt

  @@index([m_user_id])
  @@index([m_approver_id])
  @@index([status])
}

// ----------------------------------------------------------
// CHILD: Poin Bahasan (hasil diskusi per agenda)
// ----------------------------------------------------------
model c_poin_bahasan {
  id                Int    @id @default(autoincrement())
  m_notulen_id      Int
  c_agenda_rapat_id Int?   // Relasi ke agenda (opsional)
  
  urutan            Int
  isi_bahasan       String @db.Text
  pembicara         String?  // Nama yang menyampaikan

  // Relasi
  notulen           m_notulen      @relation(fields: [m_notulen_id], references: [id], onDelete: Cascade)
  agenda            c_agenda_rapat? @relation(fields: [c_agenda_rapat_id], references: [id], onDelete: SetNull)

  dibuat_pada     DateTime @default(now())
  diperbarui_pada DateTime @updatedAt

  @@index([m_notulen_id])
  @@index([c_agenda_rapat_id])
}

// ----------------------------------------------------------
// CHILD: Keputusan Rapat
// ----------------------------------------------------------
model c_keputusan_rapat {
  id              Int    @id @default(autoincrement())
  m_notulen_id    Int
  
  urutan          Int
  isi_keputusan   String @db.Text
  dasar_keputusan String? @db.Text // Landasan/alasan keputusan
  is_konsensus    Boolean @default(true) // true = mufakat, false = voting

  // Relasi
  notulen         m_notulen @relation(fields: [m_notulen_id], references: [id], onDelete: Cascade)
  tindak_lanjut   c_tindak_lanjut[] // Tindak lanjut yang timbul dari keputusan ini

  dibuat_pada     DateTime @default(now())
  diperbarui_pada DateTime @updatedAt

  @@index([m_notulen_id])
}

// ----------------------------------------------------------
// CHILD: Tindak Lanjut / Action Items
// ----------------------------------------------------------
model c_tindak_lanjut {
  id                    Int                @id @default(autoincrement())
  m_notulen_id          Int
  c_keputusan_rapat_id  Int?               // Dari keputusan mana (opsional)
  m_user_id_pic         Int?               // PIC utama
  m_user_id_pembuat     Int                // Yang membuat tindak lanjut

  judul                 String
  deskripsi             String?  @db.Text
  deadline              DateTime?
  prioritas             String   @default("SEDANG") // TINGGI, SEDANG, RENDAH
  status                StatusTindakLanjut @default(BELUM_MULAI)
  
  // Update progres
  progres_persen        Int      @default(0) // 0-100
  catatan_progres       String?  @db.Text
  diselesaikan_pada     DateTime?

  // Relasi
  notulen               m_notulen          @relation(fields: [m_notulen_id], references: [id], onDelete: Cascade)
  keputusan             c_keputusan_rapat? @relation(fields: [c_keputusan_rapat_id], references: [id], onDelete: SetNull)
  pic                   m_user?            @relation("tindak_lanjut_pic", fields: [m_user_id_pic], references: [id], onDelete: SetNull)
  pembuat               m_user             @relation("tindak_lanjut_dibuat", fields: [m_user_id_pembuat], references: [id])
  update_progres        c_update_tindak_lanjut[]

  dibuat_pada     DateTime @default(now())
  diperbarui_pada DateTime @updatedAt

  @@index([m_notulen_id])
  @@index([m_user_id_pic])
  @@index([status])
  @@index([deadline])
}

// ----------------------------------------------------------
// CHILD: Update/Log Progres Tindak Lanjut
// ----------------------------------------------------------
model c_update_tindak_lanjut {
  id                  Int    @id @default(autoincrement())
  c_tindak_lanjut_id  Int
  m_user_id           Int

  keterangan          String @db.Text
  progres_persen      Int    // Snapshot progres saat update
  status_baru         StatusTindakLanjut

  // Relasi
  tindak_lanjut       c_tindak_lanjut @relation(fields: [c_tindak_lanjut_id], references: [id], onDelete: Cascade)
  user                m_user          @relation("update_tl_oleh", fields: [m_user_id], references: [id])

  dibuat_pada         DateTime @default(now())

  @@index([c_tindak_lanjut_id])
  @@index([m_user_id])
}

// ----------------------------------------------------------
// CHILD: Lampiran Notulen
// ----------------------------------------------------------
model c_lampiran_notulen {
  id            Int    @id @default(autoincrement())
  m_notulen_id  Int
  m_user_id     Int    // Yang mengupload

  nama_file     String
  nama_asli     String // Nama file original dari user
  tipe_file     String // MIME type (application/pdf, image/jpeg, dst.)
  ukuran_bytes  Int
  url_file      String
  deskripsi     String?

  // Relasi
  notulen       m_notulen @relation(fields: [m_notulen_id], references: [id], onDelete: Cascade)
  diunggah_oleh m_user    @relation("lampiran_notulen_diunggah", fields: [m_user_id], references: [id])

  dibuat_pada   DateTime @default(now())

  @@index([m_notulen_id])
  @@index([m_user_id])
}

// ----------------------------------------------------------
// CHILD: Komentar / Anotasi Notulen
// ----------------------------------------------------------
model c_komentar_notulen {
  id              Int    @id @default(autoincrement())
  m_notulen_id    Int
  m_user_id       Int
  parent_id       Int?   // Untuk balasan komentar (threading)

  isi_komentar    String @db.Text
  is_resolved     Boolean @default(false)

  // Relasi
  notulen         m_notulen           @relation(fields: [m_notulen_id], references: [id], onDelete: Cascade)
  user            m_user              @relation("komentar_notulen_oleh", fields: [m_user_id], references: [id])
  parent          c_komentar_notulen? @relation("komentar_reply", fields: [parent_id], references: [id], onDelete: SetNull)
  balasan         c_komentar_notulen[] @relation("komentar_reply")

  dibuat_pada     DateTime @default(now())
  diperbarui_pada DateTime @updatedAt

  @@index([m_notulen_id])
  @@index([m_user_id])
  @@index([parent_id])
}

// ----------------------------------------------------------
// CHILD: Riwayat Revisi Notulen (Audit Trail konten)
// ----------------------------------------------------------
model c_revisi_notulen {
  id            Int    @id @default(autoincrement())
  m_notulen_id  Int
  m_user_id     Int

  nomor_revisi  Int    // Auto increment per notulen
  snapshot_json String @db.Text // JSON snapshot isi notulen saat revisi
  catatan_revisi String? // Apa yang diubah
  status_dari   StatusNotulen
  status_ke     StatusNotulen

  // Relasi
  notulen       m_notulen @relation(fields: [m_notulen_id], references: [id], onDelete: Cascade)
  direvisi_oleh m_user    @relation("revisi_notulen_oleh", fields: [m_user_id], references: [id])

  dibuat_pada   DateTime @default(now())

  @@index([m_notulen_id])
  @@index([m_user_id])
}
```

---

## 7. Relasi ke `m_user` yang Perlu Ditambahkan

Tambahkan relasi berikut ke model `m_user` yang sudah ada:

```prisma
// Di dalam model m_user, tambahkan relasi baru:

// ---- Notulen Rapat ----
rapat_dibuat            m_rapat[]                   @relation("rapat_dibuat")
agenda_pic              c_agenda_rapat[]             @relation("agenda_pic")
peserta_rapat           c_peserta_rapat[]            @relation("peserta_rapat")
notulen_dibuat          m_notulen[]                  @relation("notulen_dibuat")
notulen_disetujui       m_notulen[]                  @relation("notulen_disetujui")
tindak_lanjut_pic       c_tindak_lanjut[]            @relation("tindak_lanjut_pic")
tindak_lanjut_dibuat    c_tindak_lanjut[]            @relation("tindak_lanjut_dibuat")
update_tindak_lanjut    c_update_tindak_lanjut[]     @relation("update_tl_oleh")
lampiran_notulen        c_lampiran_notulen[]         @relation("lampiran_notulen_diunggah")
komentar_notulen        c_komentar_notulen[]         @relation("komentar_notulen_oleh")
revisi_notulen          c_revisi_notulen[]           @relation("revisi_notulen_oleh")
```

> ⚠️ **Catatan:** Karena di `m_user` sudah ada `rapat_dibuat rapat[]`, perlu dipastikan nama model `rapat` disesuaikan menjadi `m_rapat` dan relasi diperbarui dengan named relation.

---

## 8. API Endpoints

Semua endpoint mengikuti struktur REST yang sudah ada di proyek.

### 8.1 Rapat
```
GET    /api/rapat                      → List semua rapat (filter: status, tanggal, kategori)
POST   /api/rapat                      → Buat rapat baru
GET    /api/rapat/:id                  → Detail rapat + agenda + peserta
PUT    /api/rapat/:id                  → Update rapat
DELETE /api/rapat/:id                  → Hapus rapat
PATCH  /api/rapat/:id/status           → Update status rapat
GET    /api/rapat/:id/export           → Export undangan rapat (PDF)
```

### 8.2 Agenda Rapat
```
GET    /api/rapat/:id/agenda           → List agenda per rapat
POST   /api/rapat/:id/agenda           → Tambah agenda
PUT    /api/rapat/:id/agenda/:agendaId → Update agenda
DELETE /api/rapat/:id/agenda/:agendaId → Hapus agenda
PUT    /api/rapat/:id/agenda/reorder   → Ubah urutan agenda
```

### 8.3 Peserta Rapat
```
GET    /api/rapat/:id/peserta          → List peserta
POST   /api/rapat/:id/peserta          → Tambah peserta
PUT    /api/rapat/:id/peserta/:pid     → Update kehadiran
DELETE /api/rapat/:id/peserta/:pid     → Hapus peserta
POST   /api/rapat/:id/peserta/hadir    → Konfirmasi kehadiran (self)
```

### 8.4 Notulen
```
GET    /api/notulen                    → List semua notulen (filter: status, tanggal)
POST   /api/notulen                    → Buat notulen (dari m_rapat_id)
GET    /api/notulen/:id                → Detail notulen lengkap
PUT    /api/notulen/:id                → Update notulen
DELETE /api/notulen/:id                → Hapus notulen (hanya jika DRAFT)
PATCH  /api/notulen/:id/ajukan        → Ajukan ke reviewer (DRAFT → REVIEW)
PATCH  /api/notulen/:id/setujui       → Setujui notulen (REVIEW → DISETUJUI)
PATCH  /api/notulen/:id/tolak         → Tolak notulen (REVIEW → DITOLAK)
PATCH  /api/notulen/:id/finalisasi    → Finalisasi (DISETUJUI → FINAL)
GET    /api/notulen/:id/export/pdf    → Export notulen ke PDF
GET    /api/notulen/:id/export/docx   → Export notulen ke Word
GET    /api/notulen/:id/riwayat       → Riwayat revisi notulen
```

### 8.5 Poin Bahasan
```
GET    /api/notulen/:id/poin           → List poin bahasan
POST   /api/notulen/:id/poin           → Tambah poin bahasan
PUT    /api/notulen/:id/poin/:pid      → Update poin
DELETE /api/notulen/:id/poin/:pid      → Hapus poin
PUT    /api/notulen/:id/poin/reorder   → Reorder poin
```

### 8.6 Keputusan
```
GET    /api/notulen/:id/keputusan      → List keputusan
POST   /api/notulen/:id/keputusan      → Tambah keputusan
PUT    /api/notulen/:id/keputusan/:kid → Update keputusan
DELETE /api/notulen/:id/keputusan/:kid → Hapus keputusan
```

### 8.7 Tindak Lanjut
```
GET    /api/tindak-lanjut              → Semua TL (bisa filter by user, status, deadline)
GET    /api/tindak-lanjut/saya         → TL yang saya jadi PIC
GET    /api/notulen/:id/tindak-lanjut  → TL per notulen
POST   /api/notulen/:id/tindak-lanjut  → Tambah TL
PUT    /api/tindak-lanjut/:id          → Update TL
DELETE /api/tindak-lanjut/:id          → Hapus TL
POST   /api/tindak-lanjut/:id/update  → Tambah update progres
GET    /api/tindak-lanjut/:id/log      → Riwayat update progres
```

### 8.8 Lampiran & Komentar
```
POST   /api/notulen/:id/lampiran       → Upload lampiran
DELETE /api/lampiran-notulen/:id       → Hapus lampiran

GET    /api/notulen/:id/komentar       → List komentar
POST   /api/notulen/:id/komentar       → Tambah komentar
PUT    /api/komentar-notulen/:id       → Edit komentar
DELETE /api/komentar-notulen/:id       → Hapus komentar
PATCH  /api/komentar-notulen/:id/resolve → Tandai resolved
```

### 8.9 Dashboard & Statistik
```
GET    /api/notulen/dashboard          → Ringkasan: rapat mendatang, TL overdue, notulen pending
GET    /api/notulen/statistik          → Statistik: jumlah rapat/bulan, tingkat kehadiran, TL completion rate
```

---

## 9. Business Logic & Workflow

### 9.1 Workflow Status Notulen
```
[DRAFT] 
   │ (notulis submit)
   ▼
[REVIEW] 
   │ (pimpinan setujui)          │ (pimpinan tolak + catatan)
   ▼                             ▼
[DISETUJUI]                   [DITOLAK] → kembali ke DRAFT
   │ (finalisasi)
   ▼
[FINAL] ← tidak bisa diubah lagi
```

### 9.2 Aturan Bisnis Penting
1. Notulen hanya bisa dibuat jika rapat sudah ada dan status `BERLANGSUNG` atau `SELESAI`
2. Satu rapat hanya boleh punya satu notulen (`@unique` di `m_rapat_id`)
3. Notulen `FINAL` tidak bisa diedit — hanya bisa dikomentari
4. Setiap perubahan status notulen otomatis membuat entri di `c_revisi_notulen`
5. Tindak lanjut yang melewati `deadline` otomatis status berubah ke `TERLAMBAT` (via cron job / trigger saat fetch)
6. Notifikasi dikirim saat:
   - Rapat dibuat (ke semua peserta)
   - Notulen diajukan review (ke approver)
   - Notulen disetujui/ditolak (ke notulis)
   - Tindak lanjut mendekati deadline -3 hari (ke PIC)
   - Tindak lanjut overdue (ke PIC + pembuat)

### 9.3 Perhitungan Otomatis
- `progres_persen` tindak lanjut: diisi manual oleh PIC
- Status `TERLAMBAT`: jika `deadline < NOW()` dan status bukan `SELESAI`/`DIBATALKAN`
- Tingkat kehadiran rapat: `(jumlah HADIR / jumlah DIUNDANG) * 100`

---

## 10. Persyaratan Non-Fungsional

| Aspek | Requirement |
|-------|-------------|
| **Performance** | List notulen < 500ms (dengan pagination, limit 20) |
| **Security** | Hak akses berbasis `m_level` dan `m_jabatan` existing |
| **Audit** | Semua write operation dicatat di `log_audit` existing |
| **Pagination** | Semua list endpoint support `?page=&limit=&sort=&order=` |
| **Search** | Endpoint list support `?search=` untuk judul & deskripsi |
| **Export** | PDF/Word mengikuti template resmi organisasi |
| **Validasi** | Semua input divalidasi di layer service sebelum DB |

---

## 11. Hak Akses (Integrasi dengan `m_hak_akses_rule`)

| Aksi | Level/Jabatan |
|------|--------------|
| Buat Rapat | Admin, Ketua, Sekretaris |
| Buat/Edit Notulen (DRAFT) | Notulis (yang ditunjuk), Admin |
| Ajukan ke Review | Notulis, Sekretaris |
| Setujui/Tolak Notulen | Ketua, Pimpinan |
| Finalisasi | Admin, Ketua |
| Lihat Notulen FINAL | Semua user aktif |
| Update Tindak Lanjut | PIC yang bersangkutan, Admin |
| Hapus Rapat | Admin (jika belum ada notulen) |

---

## 12. Komponen UI yang Diperlukan

### 12.1 Halaman / View
| Halaman | Keterangan |
|---------|-----------|
| `Daftar Rapat` | Table/card view, filter status, tanggal, kategori |
| `Form Rapat` | Create/Edit rapat + agenda items (dynamic list) |
| `Detail Rapat` | Info rapat, agenda, daftar peserta + kehadiran |
| `Editor Notulen` | Rich text editor per poin bahasan, real-time save |
| `Daftar Tindak Lanjut` | Kanban/tabel, filter PIC/status/deadline |
| `Detail Tindak Lanjut` | Progres bar, log update, komentar |
| `Dashboard Notulen` | Widget: rapat mendatang, TL overdue, pending review |
| `Preview & Export Notulen` | Preview sebelum export + tombol PDF/Word |

### 12.2 Komponen Kunci
- **Timeline status notulen** — visualisasi workflow DRAFT → FINAL
- **Tabel kehadiran interaktif** — check/uncheck kehadiran peserta
- **Card tindak lanjut** — progress bar + badge prioritas + countdown deadline
- **Rich text editor** — untuk isi poin bahasan & keputusan
- **Modal komentar** — threaded comments dengan resolve button
- **Drag & drop reorder** — untuk urutan agenda dan poin bahasan

---

## 13. Template Export Notulen

Notulen yang diekspor harus memuat struktur berikut:

```
[KOP SURAT / LOGO ORGANISASI]

NOTULEN RAPAT
No. Notulen : [nomor_notulen]
Tanggal     : [tanggal rapat]
Tempat      : [lokasi]
Pimpinan    : [nama pimpinan rapat]
Notulis     : [nama notulis]

A. DAFTAR HADIR
   [Tabel peserta + jabatan + tanda tangan]

B. AGENDA RAPAT
   1. [Agenda 1]
   2. [Agenda 2]
   ...

C. JALANNYA RAPAT
   1. [Agenda 1]
      - [Poin bahasan 1]
      - [Poin bahasan 2]
   ...

D. KEPUTUSAN RAPAT
   1. [Keputusan 1]
   2. [Keputusan 2]
   ...

E. TINDAK LANJUT
   [Tabel: No | Kegiatan | PIC | Deadline | Status]

F. PENUTUP
   [Teks penutupan]

   Mengetahui,                    Notulis,
   [Tanda tangan Pimpinan]        [Tanda tangan Notulis]
   [Nama]                         [Nama]
```

---

## 14. Estimasi Pengerjaan

| Fase | Task | Estimasi |
|------|------|----------|
| **Fase 1** | Setup DB schema + migration + seeder | 1 hari |
| **Fase 2** | API Rapat & Agenda (CRUD + validasi) | 2 hari |
| **Fase 3** | API Notulen + Workflow Status | 3 hari |
| **Fase 4** | API Tindak Lanjut + Update Progres | 2 hari |
| **Fase 5** | API Lampiran + Komentar | 1 hari |
| **Fase 6** | UI Daftar & Form Rapat | 2 hari |
| **Fase 7** | UI Editor Notulen | 3 hari |
| **Fase 8** | UI Dashboard + Tindak Lanjut | 2 hari |
| **Fase 9** | Export PDF/Word + Notifikasi | 2 hari |
| **Fase 10** | Testing, bug fix, polish | 2 hari |
| **Total** | | **~20 hari kerja** |

---

## 15. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|---------|
| Konflik model `rapat` yang sudah ada | Tinggi | Audit model existing sebelum migration, rename jika perlu |
| Performa query notulen + relasi banyak | Sedang | Gunakan `select` Prisma secara spesifik, hindari `include` nested berlebihan |
| Upload file lampiran besar | Sedang | Validasi ukuran file max 10MB, gunakan storage eksternal (S3/Minio) |
| Rich text editor kompatibilitas | Rendah | Gunakan library yang sudah ada di proyek atau TipTap/Quill |

---

## 16. Catatan Implementasi (Clean Code)

```
✅ Satu file prisma terpisah: notulen.prisma
✅ Semua tabel master prefix m_, child prefix c_
✅ Semua foreign key suffix _id dengan nama m_namatabel_id
✅ Tidak mengubah file schema yang sudah ada kecuali tambah relasi di m_user
✅ Semua relasi yang sama menggunakan named relation (@relation("nama"))
✅ Index pada semua foreign key dan kolom yang sering di-query
✅ Cascade delete hanya pada child yang tidak bermakna standalone
✅ Enum untuk kolom status — bukan hardcode string
✅ Audit trail via c_revisi_notulen + log_audit existing
✅ Notifikasi via tabel notifikasi existing
```

---

*Dokumen ini adalah living document. Setiap perubahan requirement wajib diupdate sebelum implementasi dimulai.*