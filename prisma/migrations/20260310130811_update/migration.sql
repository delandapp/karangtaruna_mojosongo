/*
  Warnings:

  - The `status_pipeline` column on the `event_sponsor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `url_mou` on the `event_sponsor` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `nama_kategori` on the `m_kategori_sponsor` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to drop the column `alamat` on the `m_sponsor` table. All the data in the column will be lost.
  - You are about to drop the column `catatan` on the `m_sponsor` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `m_sponsor` table. All the data in the column will be lost.
  - You are about to drop the column `instagram` on the `m_sponsor` table. All the data in the column will be lost.
  - You are about to drop the column `logo_url` on the `m_sponsor` table. All the data in the column will be lost.
  - You are about to drop the column `nama_kontak` on the `m_sponsor` table. All the data in the column will be lost.
  - You are about to drop the column `nama_perusahaan` on the `m_sponsor` table. All the data in the column will be lost.
  - You are about to drop the column `no_handphone` on the `m_sponsor` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `m_sponsor` table. All the data in the column will be lost.
  - You are about to alter the column `url_file_proposal` on the `proposal_sponsor` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - The `respons` column on the `proposal_sponsor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[m_perusahaan_id]` on the table `m_sponsor` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `tier` on the `event_sponsor` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `jenis_kontribusi` on the `event_sponsor` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `m_perusahaan_id` to the `m_sponsor` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `tier_diusulkan` on the `proposal_sponsor` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "tier_sponsor" AS ENUM ('platinum', 'gold', 'silver', 'bronze', 'inkind');

-- CreateEnum
CREATE TYPE "jenis_kontribusi" AS ENUM ('uang', 'barang', 'jasa', 'campuran');

-- CreateEnum
CREATE TYPE "status_pipeline" AS ENUM ('prospek', 'dihubungi', 'negosiasi', 'dikonfirmasi', 'lunas', 'selesai', 'batal');

-- CreateEnum
CREATE TYPE "respons_proposal" AS ENUM ('diterima', 'ditolak', 'negosiasi', 'menunggu');

-- CreateEnum
CREATE TYPE "tier_proposal" AS ENUM ('platinum', 'gold', 'silver', 'bronze');

-- AlterTable
ALTER TABLE "event_sponsor" DROP COLUMN "tier",
ADD COLUMN     "tier" "tier_sponsor" NOT NULL,
DROP COLUMN "jenis_kontribusi",
ADD COLUMN     "jenis_kontribusi" "jenis_kontribusi" NOT NULL,
DROP COLUMN "status_pipeline",
ADD COLUMN     "status_pipeline" "status_pipeline" NOT NULL DEFAULT 'prospek',
ALTER COLUMN "url_mou" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "m_kategori_sponsor" ALTER COLUMN "nama_kategori" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "m_sponsor" DROP COLUMN "alamat",
DROP COLUMN "catatan",
DROP COLUMN "email",
DROP COLUMN "instagram",
DROP COLUMN "logo_url",
DROP COLUMN "nama_kontak",
DROP COLUMN "nama_perusahaan",
DROP COLUMN "no_handphone",
DROP COLUMN "website",
ADD COLUMN     "m_perusahaan_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "proposal_sponsor" DROP COLUMN "tier_diusulkan",
ADD COLUMN     "tier_diusulkan" "tier_proposal" NOT NULL,
ALTER COLUMN "url_file_proposal" SET DATA TYPE VARCHAR(500),
DROP COLUMN "respons",
ADD COLUMN     "respons" "respons_proposal";

-- CreateTable
CREATE TABLE "m_skala_perusahaan" (
    "id" SERIAL NOT NULL,
    "nama" VARCHAR(30) NOT NULL,

    CONSTRAINT "m_skala_perusahaan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_sektor_industri" (
    "id" SERIAL NOT NULL,
    "nama_sektor" VARCHAR(100) NOT NULL,
    "deskripsi_sektor" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_sektor_industri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_perusahaan" (
    "id" SERIAL NOT NULL,
    "m_sektor_industri_id" INTEGER,
    "m_skala_perusahaan_id" INTEGER,
    "kode_wilayah_induk_provinsi" TEXT,
    "kode_wilayah_induk_kota" TEXT,
    "kode_wilayah_induk_kecamatan" TEXT,
    "kode_wilayah_induk_kelurahan" TEXT,
    "nama" VARCHAR(200) NOT NULL,
    "nama_kontak" VARCHAR(150),
    "jabatan_kontak" VARCHAR(100),
    "no_handphone" VARCHAR(20),
    "email" VARCHAR(150),
    "website" VARCHAR(255),
    "instagram" VARCHAR(100),
    "linkedin" VARCHAR(255),
    "whatsapp" VARCHAR(20),
    "alamat" TEXT,
    "sumber_informasi" VARCHAR(255),
    "catatan" TEXT,
    "logo_url" VARCHAR(500),
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_perusahaan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_skala_perusahaan_nama_key" ON "m_skala_perusahaan"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "m_sektor_industri_nama_sektor_key" ON "m_sektor_industri"("nama_sektor");

-- CreateIndex
CREATE INDEX "m_perusahaan_m_sektor_industri_id_idx" ON "m_perusahaan"("m_sektor_industri_id");

-- CreateIndex
CREATE INDEX "m_perusahaan_m_skala_perusahaan_id_idx" ON "m_perusahaan"("m_skala_perusahaan_id");

-- CreateIndex
CREATE INDEX "m_perusahaan_nama_idx" ON "m_perusahaan"("nama");

-- CreateIndex
CREATE INDEX "event_sponsor_status_pipeline_idx" ON "event_sponsor"("status_pipeline");

-- CreateIndex
CREATE UNIQUE INDEX "m_sponsor_m_perusahaan_id_key" ON "m_sponsor"("m_perusahaan_id");

-- CreateIndex
CREATE INDEX "proposal_sponsor_respons_idx" ON "proposal_sponsor"("respons");

-- AddForeignKey
ALTER TABLE "m_perusahaan" ADD CONSTRAINT "m_perusahaan_m_sektor_industri_id_fkey" FOREIGN KEY ("m_sektor_industri_id") REFERENCES "m_sektor_industri"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_perusahaan" ADD CONSTRAINT "m_perusahaan_m_skala_perusahaan_id_fkey" FOREIGN KEY ("m_skala_perusahaan_id") REFERENCES "m_skala_perusahaan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_perusahaan" ADD CONSTRAINT "m_perusahaan_kode_wilayah_induk_provinsi_fkey" FOREIGN KEY ("kode_wilayah_induk_provinsi") REFERENCES "m_provinsi"("kode_wilayah") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_perusahaan" ADD CONSTRAINT "m_perusahaan_kode_wilayah_induk_kota_fkey" FOREIGN KEY ("kode_wilayah_induk_kota") REFERENCES "m_kota"("kode_wilayah") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_perusahaan" ADD CONSTRAINT "m_perusahaan_kode_wilayah_induk_kecamatan_fkey" FOREIGN KEY ("kode_wilayah_induk_kecamatan") REFERENCES "m_kecamatan"("kode_wilayah") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_perusahaan" ADD CONSTRAINT "m_perusahaan_kode_wilayah_induk_kelurahan_fkey" FOREIGN KEY ("kode_wilayah_induk_kelurahan") REFERENCES "m_kelurahan"("kode_wilayah") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_sponsor" ADD CONSTRAINT "m_sponsor_m_perusahaan_id_fkey" FOREIGN KEY ("m_perusahaan_id") REFERENCES "m_perusahaan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
