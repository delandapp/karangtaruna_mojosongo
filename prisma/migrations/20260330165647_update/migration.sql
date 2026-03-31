/*
  Warnings:

  - You are about to drop the column `createdAt` on the `m_bidang_brand` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `m_bidang_brand` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `m_brand` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `m_brand` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `m_hak_akses` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `m_hak_akses` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `m_jabatan` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `m_jabatan` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `m_jenjang` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `m_jenjang` table. All the data in the column will be lost.
  - You are about to drop the column `nama_kategori` on the `m_kategori_berita` table. All the data in the column will be lost.
  - You are about to drop the column `slug_kategori` on the `m_kategori_berita` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `m_kategori_brand` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `m_kategori_brand` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `m_kecamatan` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `m_kecamatan` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `m_kelurahan` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `m_kelurahan` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `m_kota` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `m_kota` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `m_level` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `m_level` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `m_provinsi` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `m_provinsi` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `m_user` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `m_user` table. All the data in the column will be lost.
  - You are about to drop the `berita` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nama]` on the table `m_kategori_berita` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `m_kategori_berita` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `diperbarui_pada` to the `m_bidang_brand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `diperbarui_pada` to the `m_brand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `diperbarui_pada` to the `m_hak_akses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `diperbarui_pada` to the `m_jabatan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `diperbarui_pada` to the `m_jenjang` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nama` to the `m_kategori_berita` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `m_kategori_berita` table without a default value. This is not possible if the table is not empty.
  - Added the required column `diperbarui_pada` to the `m_kategori_brand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `diperbarui_pada` to the `m_level` table without a default value. This is not possible if the table is not empty.
  - Added the required column `diperbarui_pada` to the `m_user` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "status_komentar" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SPAM', 'DELETED');

-- CreateEnum
CREATE TYPE "status_berita" AS ENUM ('DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "tipe_cover" AS ENUM ('LANDSCAPE_16_9', 'LANDSCAPE_4_3', 'SQUARE_1_1', 'PORTRAIT_9_16');

-- CreateEnum
CREATE TYPE "tipe_interaksi" AS ENUM ('LIKE', 'DISLIKE');

-- DropForeignKey
ALTER TABLE "berita" DROP CONSTRAINT "berita_event_id_fkey";

-- DropForeignKey
ALTER TABLE "berita" DROP CONSTRAINT "berita_m_kategori_berita_id_fkey";

-- DropForeignKey
ALTER TABLE "berita" DROP CONSTRAINT "berita_penulis_id_fkey";

-- DropIndex
DROP INDEX "m_kategori_berita_nama_kategori_key";

-- DropIndex
DROP INDEX "m_kategori_berita_slug_kategori_key";

-- AlterTable
ALTER TABLE "m_bidang_brand" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "diperbarui_pada" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "m_brand" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "diperbarui_pada" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "m_hak_akses" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "diperbarui_pada" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "m_jabatan" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "diperbarui_pada" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "m_jenjang" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "diperbarui_pada" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "m_kategori_berita" DROP COLUMN "nama_kategori",
DROP COLUMN "slug_kategori",
ADD COLUMN     "dihapus_pada" TIMESTAMP(3),
ADD COLUMN     "icon_url" VARCHAR(500),
ADD COLUMN     "is_aktif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "nama" VARCHAR(100) NOT NULL,
ADD COLUMN     "slug" VARCHAR(120) NOT NULL,
ADD COLUMN     "urutan" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "warna_hex" VARCHAR(7);

-- AlterTable
ALTER TABLE "m_kategori_brand" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "diperbarui_pada" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "m_kecamatan" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "m_kelurahan" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "m_kota" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "m_level" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "diperbarui_pada" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "m_provinsi" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "m_user" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "diperbarui_pada" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "berita";

-- CreateTable
CREATE TABLE "c_komentar_berita" (
    "id" SERIAL NOT NULL,
    "c_berita_id" INTEGER NOT NULL,
    "parent_id" INTEGER,
    "m_user_id" INTEGER,
    "guest_nama" VARCHAR(100),
    "guest_email" VARCHAR(200),
    "guest_fingerprint" VARCHAR(200),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "isi" TEXT NOT NULL,
    "status" "status_komentar" NOT NULL DEFAULT 'PENDING',
    "alasan_penolakan" TEXT,
    "total_likes" INTEGER NOT NULL DEFAULT 0,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "c_komentar_berita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_berita" (
    "id" SERIAL NOT NULL,
    "judul" VARCHAR(300) NOT NULL,
    "sub_judul" VARCHAR(500),
    "penulis" VARCHAR(150) NOT NULL,
    "editor" VARCHAR(150),
    "konten_json" JSONB NOT NULL,
    "konten_html" TEXT NOT NULL,
    "konten_plaintext" TEXT NOT NULL,
    "status" "status_berita" NOT NULL DEFAULT 'DRAFT',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_breaking_news" BOOLEAN NOT NULL DEFAULT false,
    "scheduled_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "seo_title" VARCHAR(70),
    "seo_description" VARCHAR(160),
    "seo_slug" VARCHAR(300) NOT NULL,
    "seo_canonical_url" VARCHAR(500),
    "seo_og_title" VARCHAR(200),
    "seo_og_description" VARCHAR(300),
    "seo_og_image_url" VARCHAR(500),
    "seo_twitter_card" VARCHAR(20),
    "seo_keywords" TEXT[],
    "seo_robots" VARCHAR(100),
    "seo_schema_json" JSONB,
    "total_views" BIGINT NOT NULL DEFAULT 0,
    "total_likes" INTEGER NOT NULL DEFAULT 0,
    "total_dislikes" INTEGER NOT NULL DEFAULT 0,
    "total_komentar" INTEGER NOT NULL DEFAULT 0,
    "total_share" INTEGER NOT NULL DEFAULT 0,
    "trending_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trending_updated_at" TIMESTAMP(3),
    "m_kategori_berita_id" INTEGER NOT NULL,
    "m_user_id" INTEGER,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "c_berita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_berita_image" (
    "id" SERIAL NOT NULL,
    "c_berita_id" INTEGER NOT NULL,
    "s3_key" VARCHAR(500) NOT NULL,
    "s3_url" VARCHAR(500) NOT NULL,
    "alt_text" VARCHAR(300),
    "caption" TEXT,
    "mime_type" VARCHAR(50) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "ukuran_byte" BIGINT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "c_berita_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_berita_cover" (
    "id" SERIAL NOT NULL,
    "c_berita_id" INTEGER NOT NULL,
    "tipe" "tipe_cover" NOT NULL,
    "s3_key" VARCHAR(500) NOT NULL,
    "s3_url" VARCHAR(500) NOT NULL,
    "alt_text" VARCHAR(300),
    "mime_type" VARCHAR(50) NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "ukuran_byte" BIGINT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "c_berita_cover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_tag" (
    "id" SERIAL NOT NULL,
    "nama" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "deskripsi" TEXT,
    "total_berita" INTEGER NOT NULL DEFAULT 0,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "m_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "r_berita_tag" (
    "id" SERIAL NOT NULL,
    "c_berita_id" INTEGER NOT NULL,
    "m_tag_id" INTEGER NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "r_berita_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "r_user_interaksi_berita" (
    "id" SERIAL NOT NULL,
    "c_berita_id" INTEGER NOT NULL,
    "m_user_id" INTEGER,
    "guest_identifier" VARCHAR(200),
    "tipe" "tipe_interaksi" NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "r_user_interaksi_berita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "c_komentar_berita_c_berita_id_status_dibuat_pada_idx" ON "c_komentar_berita"("c_berita_id", "status", "dibuat_pada" DESC);

-- CreateIndex
CREATE INDEX "c_komentar_berita_m_user_id_idx" ON "c_komentar_berita"("m_user_id");

-- CreateIndex
CREATE INDEX "c_komentar_berita_parent_id_idx" ON "c_komentar_berita"("parent_id");

-- CreateIndex
CREATE INDEX "c_komentar_berita_status_idx" ON "c_komentar_berita"("status");

-- CreateIndex
CREATE UNIQUE INDEX "c_berita_seo_slug_key" ON "c_berita"("seo_slug");

-- CreateIndex
CREATE INDEX "c_berita_status_published_at_idx" ON "c_berita"("status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "c_berita_m_kategori_berita_id_status_published_at_idx" ON "c_berita"("m_kategori_berita_id", "status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "c_berita_trending_score_idx" ON "c_berita"("trending_score" DESC);

-- CreateIndex
CREATE INDEX "c_berita_total_views_idx" ON "c_berita"("total_views" DESC);

-- CreateIndex
CREATE INDEX "c_berita_seo_slug_idx" ON "c_berita"("seo_slug");

-- CreateIndex
CREATE INDEX "c_berita_is_featured_status_idx" ON "c_berita"("is_featured", "status");

-- CreateIndex
CREATE INDEX "c_berita_is_breaking_news_status_idx" ON "c_berita"("is_breaking_news", "status");

-- CreateIndex
CREATE INDEX "c_berita_m_user_id_idx" ON "c_berita"("m_user_id");

-- CreateIndex
CREATE INDEX "c_berita_dihapus_pada_idx" ON "c_berita"("dihapus_pada");

-- CreateIndex
CREATE INDEX "c_berita_image_c_berita_id_idx" ON "c_berita_image"("c_berita_id");

-- CreateIndex
CREATE INDEX "c_berita_cover_c_berita_id_idx" ON "c_berita_cover"("c_berita_id");

-- CreateIndex
CREATE UNIQUE INDEX "c_berita_cover_c_berita_id_tipe_key" ON "c_berita_cover"("c_berita_id", "tipe");

-- CreateIndex
CREATE UNIQUE INDEX "m_tag_nama_key" ON "m_tag"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "m_tag_slug_key" ON "m_tag"("slug");

-- CreateIndex
CREATE INDEX "m_tag_slug_idx" ON "m_tag"("slug");

-- CreateIndex
CREATE INDEX "m_tag_total_berita_idx" ON "m_tag"("total_berita" DESC);

-- CreateIndex
CREATE INDEX "r_berita_tag_c_berita_id_idx" ON "r_berita_tag"("c_berita_id");

-- CreateIndex
CREATE INDEX "r_berita_tag_m_tag_id_idx" ON "r_berita_tag"("m_tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "r_berita_tag_c_berita_id_m_tag_id_key" ON "r_berita_tag"("c_berita_id", "m_tag_id");

-- CreateIndex
CREATE INDEX "r_user_interaksi_berita_c_berita_id_idx" ON "r_user_interaksi_berita"("c_berita_id");

-- CreateIndex
CREATE INDEX "r_user_interaksi_berita_m_user_id_idx" ON "r_user_interaksi_berita"("m_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "r_user_interaksi_berita_c_berita_id_m_user_id_key" ON "r_user_interaksi_berita"("c_berita_id", "m_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "r_user_interaksi_berita_c_berita_id_guest_identifier_key" ON "r_user_interaksi_berita"("c_berita_id", "guest_identifier");

-- CreateIndex
CREATE UNIQUE INDEX "m_kategori_berita_nama_key" ON "m_kategori_berita"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "m_kategori_berita_slug_key" ON "m_kategori_berita"("slug");

-- CreateIndex
CREATE INDEX "m_kategori_berita_slug_idx" ON "m_kategori_berita"("slug");

-- CreateIndex
CREATE INDEX "m_kategori_berita_is_aktif_urutan_idx" ON "m_kategori_berita"("is_aktif", "urutan");

-- AddForeignKey
ALTER TABLE "c_komentar_berita" ADD CONSTRAINT "c_komentar_berita_c_berita_id_fkey" FOREIGN KEY ("c_berita_id") REFERENCES "c_berita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_komentar_berita" ADD CONSTRAINT "c_komentar_berita_m_user_id_fkey" FOREIGN KEY ("m_user_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_komentar_berita" ADD CONSTRAINT "c_komentar_berita_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "c_komentar_berita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_berita" ADD CONSTRAINT "c_berita_m_kategori_berita_id_fkey" FOREIGN KEY ("m_kategori_berita_id") REFERENCES "m_kategori_berita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_berita" ADD CONSTRAINT "c_berita_m_user_id_fkey" FOREIGN KEY ("m_user_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_berita_image" ADD CONSTRAINT "c_berita_image_c_berita_id_fkey" FOREIGN KEY ("c_berita_id") REFERENCES "c_berita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_berita_cover" ADD CONSTRAINT "c_berita_cover_c_berita_id_fkey" FOREIGN KEY ("c_berita_id") REFERENCES "c_berita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_berita_tag" ADD CONSTRAINT "r_berita_tag_c_berita_id_fkey" FOREIGN KEY ("c_berita_id") REFERENCES "c_berita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_berita_tag" ADD CONSTRAINT "r_berita_tag_m_tag_id_fkey" FOREIGN KEY ("m_tag_id") REFERENCES "m_tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_user_interaksi_berita" ADD CONSTRAINT "r_user_interaksi_berita_c_berita_id_fkey" FOREIGN KEY ("c_berita_id") REFERENCES "c_berita"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_user_interaksi_berita" ADD CONSTRAINT "r_user_interaksi_berita_m_user_id_fkey" FOREIGN KEY ("m_user_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
