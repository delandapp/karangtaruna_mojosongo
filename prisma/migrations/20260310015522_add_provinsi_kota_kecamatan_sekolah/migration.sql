-- CreateTable
CREATE TABLE "m_jenjang" (
    "id" BIGSERIAL NOT NULL,
    "nama" VARCHAR(10) NOT NULL,
    "deskripsi" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "m_jenjang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_kecamatan" (
    "id" BIGSERIAL NOT NULL,
    "m_kota_id" BIGINT,
    "kode_wilayah" TEXT,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_kecamatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_kelurahan" (
    "id" BIGSERIAL NOT NULL,
    "m_kecamatan_id" BIGINT,
    "kode_wilayah" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_kelurahan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_kota" (
    "id" BIGSERIAL NOT NULL,
    "m_provinsi_id" BIGINT,
    "kode_wilayah" TEXT,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_kota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_provinsi" (
    "id" BIGSERIAL NOT NULL,
    "kode_wilayah" TEXT,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_provinsi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_sekolah" (
    "id" BIGSERIAL NOT NULL,
    "kode_wilayah_induk_provinsi" TEXT,
    "kode_wilayah_induk_kota" TEXT,
    "kode_wilayah_induk_kecamatan" TEXT,
    "kode_wilayah_induk_kelurahan" TEXT,
    "kode_sekolah" TEXT,
    "m_jenjang_id" BIGINT,
    "jenis_sekolah" TEXT DEFAULT 'Negeri',
    "nama" TEXT NOT NULL,
    "alamat" TEXT,
    "npsn" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "kode_pos" TEXT,
    "rt" TEXT,
    "rw" TEXT,
    "bujur" TEXT,
    "lintang" TEXT,
    "akreditasi" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_sekolah_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_jenjang_nama_key" ON "m_jenjang"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "m_kecamatan_kode_wilayah_key" ON "m_kecamatan"("kode_wilayah");

-- CreateIndex
CREATE INDEX "m_kecamatan_m_kota_id_idx" ON "m_kecamatan"("m_kota_id");

-- CreateIndex
CREATE UNIQUE INDEX "m_kelurahan_kode_wilayah_key" ON "m_kelurahan"("kode_wilayah");

-- CreateIndex
CREATE INDEX "m_kelurahan_m_kecamatan_id_idx" ON "m_kelurahan"("m_kecamatan_id");

-- CreateIndex
CREATE UNIQUE INDEX "m_kota_kode_wilayah_key" ON "m_kota"("kode_wilayah");

-- CreateIndex
CREATE INDEX "m_kota_m_provinsi_id_idx" ON "m_kota"("m_provinsi_id");

-- CreateIndex
CREATE UNIQUE INDEX "m_provinsi_kode_wilayah_key" ON "m_provinsi"("kode_wilayah");

-- CreateIndex
CREATE UNIQUE INDEX "m_sekolah_kode_sekolah_key" ON "m_sekolah"("kode_sekolah");

-- CreateIndex
CREATE INDEX "m_sekolah_kode_wilayah_induk_provinsi_kode_wilayah_induk_ke_idx" ON "m_sekolah"("kode_wilayah_induk_provinsi", "kode_wilayah_induk_kecamatan", "m_jenjang_id");

-- AddForeignKey
ALTER TABLE "m_kecamatan" ADD CONSTRAINT "m_kecamatan_m_kota_id_fkey" FOREIGN KEY ("m_kota_id") REFERENCES "m_kota"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_kelurahan" ADD CONSTRAINT "m_kelurahan_m_kecamatan_id_fkey" FOREIGN KEY ("m_kecamatan_id") REFERENCES "m_kecamatan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_kota" ADD CONSTRAINT "m_kota_m_provinsi_id_fkey" FOREIGN KEY ("m_provinsi_id") REFERENCES "m_provinsi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_sekolah" ADD CONSTRAINT "m_sekolah_m_jenjang_id_fkey" FOREIGN KEY ("m_jenjang_id") REFERENCES "m_jenjang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_sekolah" ADD CONSTRAINT "m_sekolah_kode_wilayah_induk_provinsi_fkey" FOREIGN KEY ("kode_wilayah_induk_provinsi") REFERENCES "m_provinsi"("kode_wilayah") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_sekolah" ADD CONSTRAINT "m_sekolah_kode_wilayah_induk_kota_fkey" FOREIGN KEY ("kode_wilayah_induk_kota") REFERENCES "m_kota"("kode_wilayah") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_sekolah" ADD CONSTRAINT "m_sekolah_kode_wilayah_induk_kecamatan_fkey" FOREIGN KEY ("kode_wilayah_induk_kecamatan") REFERENCES "m_kecamatan"("kode_wilayah") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_sekolah" ADD CONSTRAINT "m_sekolah_kode_wilayah_induk_kelurahan_fkey" FOREIGN KEY ("kode_wilayah_induk_kelurahan") REFERENCES "m_kelurahan"("kode_wilayah") ON DELETE SET NULL ON UPDATE CASCADE;
