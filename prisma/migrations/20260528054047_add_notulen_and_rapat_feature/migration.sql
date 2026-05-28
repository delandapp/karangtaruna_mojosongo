/*
  Warnings:

  - You are about to drop the `rapat` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "StatusRapat" AS ENUM ('TERJADWAL', 'BERLANGSUNG', 'SELESAI', 'DIBATALKAN', 'DITUNDA');

-- CreateEnum
CREATE TYPE "StatusNotulen" AS ENUM ('DRAFT', 'REVIEW', 'DISETUJUI', 'FINAL', 'DITOLAK');

-- CreateEnum
CREATE TYPE "StatusTindakLanjut" AS ENUM ('BELUM_MULAI', 'DALAM_PROSES', 'SELESAI', 'TERLAMBAT', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "JenisRapat" AS ENUM ('INTERNAL', 'EKSTERNAL', 'KOORDINASI', 'EVALUASI', 'DARURAT', 'LAINNYA');

-- CreateEnum
CREATE TYPE "StatusKehadiran" AS ENUM ('DIUNDANG', 'HADIR', 'TIDAK_HADIR', 'IZIN', 'TERLAMBAT');

-- DropForeignKey
ALTER TABLE "rapat" DROP CONSTRAINT "rapat_dibuat_oleh_id_fkey";

-- DropForeignKey
ALTER TABLE "rapat" DROP CONSTRAINT "rapat_event_id_fkey";

-- DropTable
DROP TABLE "rapat";

-- CreateTable
CREATE TABLE "m_notulen" (
    "id" SERIAL NOT NULL,
    "m_rapat_id" INTEGER NOT NULL,
    "m_user_id" INTEGER NOT NULL,
    "m_approver_id" INTEGER,
    "nomor_notulen" TEXT,
    "status" "StatusNotulen" NOT NULL DEFAULT 'DRAFT',
    "pembukaan" TEXT,
    "penutupan" TEXT,
    "kesimpulan_umum" TEXT,
    "diajukan_pada" TIMESTAMP(3),
    "disetujui_pada" TIMESTAMP(3),
    "catatan_penolakan" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_notulen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_poin_bahasan" (
    "id" SERIAL NOT NULL,
    "m_notulen_id" INTEGER NOT NULL,
    "c_agenda_rapat_id" INTEGER,
    "urutan" INTEGER NOT NULL,
    "isi_bahasan" TEXT NOT NULL,
    "pembicara" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "c_poin_bahasan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_keputusan_rapat" (
    "id" SERIAL NOT NULL,
    "m_notulen_id" INTEGER NOT NULL,
    "urutan" INTEGER NOT NULL,
    "isi_keputusan" TEXT NOT NULL,
    "dasar_keputusan" TEXT,
    "is_konsensus" BOOLEAN NOT NULL DEFAULT true,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "c_keputusan_rapat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_tindak_lanjut" (
    "id" SERIAL NOT NULL,
    "m_notulen_id" INTEGER NOT NULL,
    "c_keputusan_rapat_id" INTEGER,
    "m_user_id_pic" INTEGER,
    "m_user_id_pembuat" INTEGER NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "deadline" TIMESTAMP(3),
    "prioritas" TEXT NOT NULL DEFAULT 'SEDANG',
    "status" "StatusTindakLanjut" NOT NULL DEFAULT 'BELUM_MULAI',
    "progres_persen" INTEGER NOT NULL DEFAULT 0,
    "catatan_progres" TEXT,
    "diselesaikan_pada" TIMESTAMP(3),
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "c_tindak_lanjut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_update_tindak_lanjut" (
    "id" SERIAL NOT NULL,
    "c_tindak_lanjut_id" INTEGER NOT NULL,
    "m_user_id" INTEGER NOT NULL,
    "keterangan" TEXT NOT NULL,
    "progres_persen" INTEGER NOT NULL,
    "status_baru" "StatusTindakLanjut" NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "c_update_tindak_lanjut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_lampiran_notulen" (
    "id" SERIAL NOT NULL,
    "m_notulen_id" INTEGER NOT NULL,
    "m_user_id" INTEGER NOT NULL,
    "nama_file" TEXT NOT NULL,
    "nama_asli" TEXT NOT NULL,
    "tipe_file" TEXT NOT NULL,
    "ukuran_bytes" INTEGER NOT NULL,
    "url_file" TEXT NOT NULL,
    "deskripsi" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "c_lampiran_notulen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_komentar_notulen" (
    "id" SERIAL NOT NULL,
    "m_notulen_id" INTEGER NOT NULL,
    "m_user_id" INTEGER NOT NULL,
    "parent_id" INTEGER,
    "isi_komentar" TEXT NOT NULL,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "c_komentar_notulen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_revisi_notulen" (
    "id" SERIAL NOT NULL,
    "m_notulen_id" INTEGER NOT NULL,
    "m_user_id" INTEGER NOT NULL,
    "nomor_revisi" INTEGER NOT NULL,
    "snapshot_json" TEXT NOT NULL,
    "catatan_revisi" TEXT,
    "status_dari" "StatusNotulen" NOT NULL,
    "status_ke" "StatusNotulen" NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "c_revisi_notulen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_kategori_rapat" (
    "id" SERIAL NOT NULL,
    "nama_kategori" TEXT NOT NULL,
    "deskripsi" TEXT,
    "warna_hex" TEXT,
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_kategori_rapat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_rapat" (
    "id" SERIAL NOT NULL,
    "m_kategori_rapat_id" INTEGER,
    "m_user_id" INTEGER NOT NULL,
    "event_id" INTEGER,
    "judul_rapat" TEXT NOT NULL,
    "jenis_rapat" "JenisRapat" NOT NULL DEFAULT 'INTERNAL',
    "status_rapat" "StatusRapat" NOT NULL DEFAULT 'TERJADWAL',
    "deskripsi" TEXT,
    "tanggal_mulai" TIMESTAMP(3) NOT NULL,
    "tanggal_selesai" TIMESTAMP(3),
    "lokasi" TEXT,
    "link_online" TEXT,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "nomor_rapat" TEXT,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_rapat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_agenda_rapat" (
    "id" SERIAL NOT NULL,
    "m_rapat_id" INTEGER NOT NULL,
    "m_user_id" INTEGER,
    "urutan" INTEGER NOT NULL,
    "judul_agenda" TEXT NOT NULL,
    "deskripsi" TEXT,
    "durasi_menit" INTEGER,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "c_agenda_rapat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_peserta_rapat" (
    "id" SERIAL NOT NULL,
    "m_rapat_id" INTEGER NOT NULL,
    "m_user_id" INTEGER,
    "nama_peserta" TEXT NOT NULL,
    "jabatan_peserta" TEXT,
    "instansi" TEXT,
    "email" TEXT,
    "no_handphone" TEXT,
    "status_kehadiran" "StatusKehadiran" NOT NULL DEFAULT 'DIUNDANG',
    "waktu_hadir" TIMESTAMP(3),
    "catatan_kehadiran" TEXT,
    "tanda_tangan_url" TEXT,
    "is_moderator" BOOLEAN NOT NULL DEFAULT false,
    "is_notulis" BOOLEAN NOT NULL DEFAULT false,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "c_peserta_rapat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_notulen_m_rapat_id_key" ON "m_notulen"("m_rapat_id");

-- CreateIndex
CREATE UNIQUE INDEX "m_notulen_nomor_notulen_key" ON "m_notulen"("nomor_notulen");

-- CreateIndex
CREATE INDEX "m_notulen_m_user_id_idx" ON "m_notulen"("m_user_id");

-- CreateIndex
CREATE INDEX "m_notulen_m_approver_id_idx" ON "m_notulen"("m_approver_id");

-- CreateIndex
CREATE INDEX "m_notulen_status_idx" ON "m_notulen"("status");

-- CreateIndex
CREATE INDEX "c_poin_bahasan_m_notulen_id_idx" ON "c_poin_bahasan"("m_notulen_id");

-- CreateIndex
CREATE INDEX "c_poin_bahasan_c_agenda_rapat_id_idx" ON "c_poin_bahasan"("c_agenda_rapat_id");

-- CreateIndex
CREATE INDEX "c_keputusan_rapat_m_notulen_id_idx" ON "c_keputusan_rapat"("m_notulen_id");

-- CreateIndex
CREATE INDEX "c_tindak_lanjut_m_notulen_id_idx" ON "c_tindak_lanjut"("m_notulen_id");

-- CreateIndex
CREATE INDEX "c_tindak_lanjut_m_user_id_pic_idx" ON "c_tindak_lanjut"("m_user_id_pic");

-- CreateIndex
CREATE INDEX "c_tindak_lanjut_status_idx" ON "c_tindak_lanjut"("status");

-- CreateIndex
CREATE INDEX "c_tindak_lanjut_deadline_idx" ON "c_tindak_lanjut"("deadline");

-- CreateIndex
CREATE INDEX "c_update_tindak_lanjut_c_tindak_lanjut_id_idx" ON "c_update_tindak_lanjut"("c_tindak_lanjut_id");

-- CreateIndex
CREATE INDEX "c_update_tindak_lanjut_m_user_id_idx" ON "c_update_tindak_lanjut"("m_user_id");

-- CreateIndex
CREATE INDEX "c_lampiran_notulen_m_notulen_id_idx" ON "c_lampiran_notulen"("m_notulen_id");

-- CreateIndex
CREATE INDEX "c_lampiran_notulen_m_user_id_idx" ON "c_lampiran_notulen"("m_user_id");

-- CreateIndex
CREATE INDEX "c_komentar_notulen_m_notulen_id_idx" ON "c_komentar_notulen"("m_notulen_id");

-- CreateIndex
CREATE INDEX "c_komentar_notulen_m_user_id_idx" ON "c_komentar_notulen"("m_user_id");

-- CreateIndex
CREATE INDEX "c_komentar_notulen_parent_id_idx" ON "c_komentar_notulen"("parent_id");

-- CreateIndex
CREATE INDEX "c_revisi_notulen_m_notulen_id_idx" ON "c_revisi_notulen"("m_notulen_id");

-- CreateIndex
CREATE INDEX "c_revisi_notulen_m_user_id_idx" ON "c_revisi_notulen"("m_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "m_kategori_rapat_nama_kategori_key" ON "m_kategori_rapat"("nama_kategori");

-- CreateIndex
CREATE UNIQUE INDEX "m_rapat_nomor_rapat_key" ON "m_rapat"("nomor_rapat");

-- CreateIndex
CREATE INDEX "m_rapat_m_user_id_idx" ON "m_rapat"("m_user_id");

-- CreateIndex
CREATE INDEX "m_rapat_m_kategori_rapat_id_idx" ON "m_rapat"("m_kategori_rapat_id");

-- CreateIndex
CREATE INDEX "m_rapat_event_id_idx" ON "m_rapat"("event_id");

-- CreateIndex
CREATE INDEX "m_rapat_status_rapat_idx" ON "m_rapat"("status_rapat");

-- CreateIndex
CREATE INDEX "m_rapat_tanggal_mulai_idx" ON "m_rapat"("tanggal_mulai");

-- CreateIndex
CREATE INDEX "c_agenda_rapat_m_rapat_id_idx" ON "c_agenda_rapat"("m_rapat_id");

-- CreateIndex
CREATE INDEX "c_agenda_rapat_m_user_id_idx" ON "c_agenda_rapat"("m_user_id");

-- CreateIndex
CREATE INDEX "c_peserta_rapat_m_rapat_id_idx" ON "c_peserta_rapat"("m_rapat_id");

-- CreateIndex
CREATE INDEX "c_peserta_rapat_m_user_id_idx" ON "c_peserta_rapat"("m_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "c_peserta_rapat_m_rapat_id_m_user_id_key" ON "c_peserta_rapat"("m_rapat_id", "m_user_id");

-- AddForeignKey
ALTER TABLE "m_notulen" ADD CONSTRAINT "m_notulen_m_rapat_id_fkey" FOREIGN KEY ("m_rapat_id") REFERENCES "m_rapat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_notulen" ADD CONSTRAINT "m_notulen_m_user_id_fkey" FOREIGN KEY ("m_user_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_notulen" ADD CONSTRAINT "m_notulen_m_approver_id_fkey" FOREIGN KEY ("m_approver_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_poin_bahasan" ADD CONSTRAINT "c_poin_bahasan_m_notulen_id_fkey" FOREIGN KEY ("m_notulen_id") REFERENCES "m_notulen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_poin_bahasan" ADD CONSTRAINT "c_poin_bahasan_c_agenda_rapat_id_fkey" FOREIGN KEY ("c_agenda_rapat_id") REFERENCES "c_agenda_rapat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_keputusan_rapat" ADD CONSTRAINT "c_keputusan_rapat_m_notulen_id_fkey" FOREIGN KEY ("m_notulen_id") REFERENCES "m_notulen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_tindak_lanjut" ADD CONSTRAINT "c_tindak_lanjut_m_notulen_id_fkey" FOREIGN KEY ("m_notulen_id") REFERENCES "m_notulen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_tindak_lanjut" ADD CONSTRAINT "c_tindak_lanjut_c_keputusan_rapat_id_fkey" FOREIGN KEY ("c_keputusan_rapat_id") REFERENCES "c_keputusan_rapat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_tindak_lanjut" ADD CONSTRAINT "c_tindak_lanjut_m_user_id_pic_fkey" FOREIGN KEY ("m_user_id_pic") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_tindak_lanjut" ADD CONSTRAINT "c_tindak_lanjut_m_user_id_pembuat_fkey" FOREIGN KEY ("m_user_id_pembuat") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_update_tindak_lanjut" ADD CONSTRAINT "c_update_tindak_lanjut_c_tindak_lanjut_id_fkey" FOREIGN KEY ("c_tindak_lanjut_id") REFERENCES "c_tindak_lanjut"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_update_tindak_lanjut" ADD CONSTRAINT "c_update_tindak_lanjut_m_user_id_fkey" FOREIGN KEY ("m_user_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_lampiran_notulen" ADD CONSTRAINT "c_lampiran_notulen_m_notulen_id_fkey" FOREIGN KEY ("m_notulen_id") REFERENCES "m_notulen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_lampiran_notulen" ADD CONSTRAINT "c_lampiran_notulen_m_user_id_fkey" FOREIGN KEY ("m_user_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_komentar_notulen" ADD CONSTRAINT "c_komentar_notulen_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "c_komentar_notulen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_komentar_notulen" ADD CONSTRAINT "c_komentar_notulen_m_notulen_id_fkey" FOREIGN KEY ("m_notulen_id") REFERENCES "m_notulen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_komentar_notulen" ADD CONSTRAINT "c_komentar_notulen_m_user_id_fkey" FOREIGN KEY ("m_user_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_revisi_notulen" ADD CONSTRAINT "c_revisi_notulen_m_notulen_id_fkey" FOREIGN KEY ("m_notulen_id") REFERENCES "m_notulen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_revisi_notulen" ADD CONSTRAINT "c_revisi_notulen_m_user_id_fkey" FOREIGN KEY ("m_user_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_rapat" ADD CONSTRAINT "m_rapat_m_kategori_rapat_id_fkey" FOREIGN KEY ("m_kategori_rapat_id") REFERENCES "m_kategori_rapat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_rapat" ADD CONSTRAINT "m_rapat_m_user_id_fkey" FOREIGN KEY ("m_user_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_rapat" ADD CONSTRAINT "m_rapat_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_agenda_rapat" ADD CONSTRAINT "c_agenda_rapat_m_rapat_id_fkey" FOREIGN KEY ("m_rapat_id") REFERENCES "m_rapat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_agenda_rapat" ADD CONSTRAINT "c_agenda_rapat_m_user_id_fkey" FOREIGN KEY ("m_user_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_peserta_rapat" ADD CONSTRAINT "c_peserta_rapat_m_rapat_id_fkey" FOREIGN KEY ("m_rapat_id") REFERENCES "m_rapat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_peserta_rapat" ADD CONSTRAINT "c_peserta_rapat_m_user_id_fkey" FOREIGN KEY ("m_user_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
