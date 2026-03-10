-- AlterTable
ALTER TABLE "m_jenjang" ALTER COLUMN "nama" SET DATA TYPE VARCHAR(100);

-- CreateTable
CREATE TABLE "m_sekolah_detail" (
    "id" BIGSERIAL NOT NULL,
    "m_sekolah_id" BIGINT NOT NULL,

    CONSTRAINT "m_sekolah_detail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_sekolah_detail_m_sekolah_id_key" ON "m_sekolah_detail"("m_sekolah_id");

-- CreateIndex
CREATE INDEX "m_sekolah_detail_m_sekolah_id_idx" ON "m_sekolah_detail"("m_sekolah_id");

-- AddForeignKey
ALTER TABLE "m_sekolah_detail" ADD CONSTRAINT "m_sekolah_detail_m_sekolah_id_fkey" FOREIGN KEY ("m_sekolah_id") REFERENCES "m_sekolah"("id") ON DELETE CASCADE ON UPDATE CASCADE;
