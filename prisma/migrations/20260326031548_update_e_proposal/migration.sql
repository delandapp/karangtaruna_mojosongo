/*
  Warnings:

  - You are about to drop the column `kecamatan` on the `m_organisasi` table. All the data in the column will be lost.
  - You are about to drop the column `kelurahan` on the `m_organisasi` table. All the data in the column will be lost.
  - You are about to drop the column `kota` on the `m_organisasi` table. All the data in the column will be lost.
  - You are about to drop the column `provinsi` on the `m_organisasi` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[m_brand_id]` on the table `m_sponsor` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "m_sponsor" DROP CONSTRAINT "m_sponsor_m_perusahaan_id_fkey";

-- AlterTable
ALTER TABLE "m_organisasi" DROP COLUMN "kecamatan",
DROP COLUMN "kelurahan",
DROP COLUMN "kota",
DROP COLUMN "provinsi",
ADD COLUMN     "kode_wilayah_induk_kecamatan" TEXT,
ADD COLUMN     "kode_wilayah_induk_kelurahan" TEXT,
ADD COLUMN     "kode_wilayah_induk_kota" TEXT,
ADD COLUMN     "kode_wilayah_induk_provinsi" TEXT;

-- AlterTable
ALTER TABLE "m_sponsor" ADD COLUMN     "m_brand_id" INTEGER,
ALTER COLUMN "m_perusahaan_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "m_eproposal" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "dibuat_oleh_id" INTEGER NOT NULL,
    "judul" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "deskripsi" TEXT,
    "file_pdf_url" TEXT NOT NULL,
    "cover_url" TEXT,
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_eproposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_eproposal_pengaturan" (
    "id" SERIAL NOT NULL,
    "m_eproposal_id" INTEGER NOT NULL,
    "auto_flip" BOOLEAN NOT NULL DEFAULT false,
    "sound_effect" BOOLEAN NOT NULL DEFAULT true,
    "bg_music_url" TEXT,
    "theme_color" TEXT NOT NULL DEFAULT '#ffffff',
    "animasi_transisi" TEXT NOT NULL DEFAULT 'flip',

    CONSTRAINT "c_eproposal_pengaturan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_eproposal_daftar_isi" (
    "id" SERIAL NOT NULL,
    "m_eproposal_id" INTEGER NOT NULL,
    "judul" TEXT NOT NULL,
    "halaman" INTEGER NOT NULL,
    "urutan" INTEGER NOT NULL,

    CONSTRAINT "c_eproposal_daftar_isi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_eproposal_event_id_key" ON "m_eproposal"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "m_eproposal_slug_key" ON "m_eproposal"("slug");

-- CreateIndex
CREATE INDEX "m_eproposal_event_id_idx" ON "m_eproposal"("event_id");

-- CreateIndex
CREATE INDEX "m_eproposal_slug_idx" ON "m_eproposal"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "c_eproposal_pengaturan_m_eproposal_id_key" ON "c_eproposal_pengaturan"("m_eproposal_id");

-- CreateIndex
CREATE INDEX "c_eproposal_daftar_isi_m_eproposal_id_idx" ON "c_eproposal_daftar_isi"("m_eproposal_id");

-- CreateIndex
CREATE UNIQUE INDEX "m_sponsor_m_brand_id_key" ON "m_sponsor"("m_brand_id");

-- AddForeignKey
ALTER TABLE "m_eproposal" ADD CONSTRAINT "m_eproposal_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_eproposal" ADD CONSTRAINT "m_eproposal_dibuat_oleh_id_fkey" FOREIGN KEY ("dibuat_oleh_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_eproposal_pengaturan" ADD CONSTRAINT "c_eproposal_pengaturan_m_eproposal_id_fkey" FOREIGN KEY ("m_eproposal_id") REFERENCES "m_eproposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_eproposal_daftar_isi" ADD CONSTRAINT "c_eproposal_daftar_isi_m_eproposal_id_fkey" FOREIGN KEY ("m_eproposal_id") REFERENCES "m_eproposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_organisasi" ADD CONSTRAINT "m_organisasi_kode_wilayah_induk_provinsi_fkey" FOREIGN KEY ("kode_wilayah_induk_provinsi") REFERENCES "m_provinsi"("kode_wilayah") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_organisasi" ADD CONSTRAINT "m_organisasi_kode_wilayah_induk_kota_fkey" FOREIGN KEY ("kode_wilayah_induk_kota") REFERENCES "m_kota"("kode_wilayah") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_organisasi" ADD CONSTRAINT "m_organisasi_kode_wilayah_induk_kecamatan_fkey" FOREIGN KEY ("kode_wilayah_induk_kecamatan") REFERENCES "m_kecamatan"("kode_wilayah") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_organisasi" ADD CONSTRAINT "m_organisasi_kode_wilayah_induk_kelurahan_fkey" FOREIGN KEY ("kode_wilayah_induk_kelurahan") REFERENCES "m_kelurahan"("kode_wilayah") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_sponsor" ADD CONSTRAINT "m_sponsor_m_perusahaan_id_fkey" FOREIGN KEY ("m_perusahaan_id") REFERENCES "m_perusahaan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_sponsor" ADD CONSTRAINT "m_sponsor_m_brand_id_fkey" FOREIGN KEY ("m_brand_id") REFERENCES "m_brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
