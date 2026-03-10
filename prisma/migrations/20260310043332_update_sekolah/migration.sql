/*
  Warnings:

  - Added the required column `diperbarui_pada` to the `m_sekolah_detail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "m_sekolah" ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "m_sekolah_detail" ADD COLUMN     "akses_internet" VARCHAR(50),
ADD COLUMN     "akses_internet_2" VARCHAR(50),
ADD COLUMN     "daya_listrik" INTEGER,
ADD COLUMN     "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "diperbarui_pada" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "jumlah_guru_laki" INTEGER DEFAULT 0,
ADD COLUMN     "jumlah_guru_perempuan" INTEGER DEFAULT 0,
ADD COLUMN     "luas_tanah_bukan_milik" INTEGER,
ADD COLUMN     "luas_tanah_milik" INTEGER,
ADD COLUMN     "nama_kepala_sekolah" VARCHAR(150),
ADD COLUMN     "nama_operator_sekolah" VARCHAR(150),
ADD COLUMN     "persentase_guru_asn" DECIMAL(5,2),
ADD COLUMN     "persentase_guru_klasifikasi" DECIMAL(5,2),
ADD COLUMN     "persentase_guru_sertifikasi" DECIMAL(5,2),
ADD COLUMN     "persentase_ruang_kelas_layak" DECIMAL(5,2),
ADD COLUMN     "sumber_listrik" VARCHAR(50),
ADD COLUMN     "total_siswa" INTEGER DEFAULT 0,
ADD COLUMN     "total_siswa_laki" INTEGER DEFAULT 0,
ADD COLUMN     "total_siswa_perempuan" INTEGER DEFAULT 0;

-- CreateTable
CREATE TABLE "m_sekolah_foto" (
    "id" BIGSERIAL NOT NULL,
    "m_sekolah_detail_id" BIGINT NOT NULL,
    "path_file" TEXT NOT NULL,
    "urutan" INTEGER DEFAULT 0,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "m_sekolah_foto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "m_sekolah_foto_m_sekolah_detail_id_idx" ON "m_sekolah_foto"("m_sekolah_detail_id");

-- AddForeignKey
ALTER TABLE "m_sekolah_foto" ADD CONSTRAINT "m_sekolah_foto_m_sekolah_detail_id_fkey" FOREIGN KEY ("m_sekolah_detail_id") REFERENCES "m_sekolah_detail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
