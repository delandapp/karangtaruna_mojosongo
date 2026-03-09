-- CreateTable
CREATE TABLE "m_kategori_brand" (
    "id" SERIAL NOT NULL,
    "nama_kategori" TEXT NOT NULL,
    "deskripsi_kategori" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_kategori_brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_bidang_brand" (
    "id" SERIAL NOT NULL,
    "nama_bidang" TEXT NOT NULL,
    "deskripsi_bidang" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_bidang_brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_brand" (
    "id" SERIAL NOT NULL,
    "m_bidang_brand_id" INTEGER,
    "m_kategori_brand_id" INTEGER,
    "nama_brand" TEXT NOT NULL,
    "whatsapp_brand" TEXT,
    "email_brand" TEXT,
    "linkend_brand" TEXT,
    "instagram_brand" TEXT,
    "presentase_keberhasilan" DOUBLE PRECISION,
    "perusahaan_induk" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_hak_akses" (
    "id" SERIAL NOT NULL,
    "nama_fitur" TEXT NOT NULL,
    "tipe_fitur" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "is_all_level" BOOLEAN NOT NULL DEFAULT false,
    "is_all_jabatan" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_hak_akses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_hak_akses_rule" (
    "id" SERIAL NOT NULL,
    "m_hak_akses_id" INTEGER NOT NULL,
    "m_level_id" INTEGER,
    "m_jabatan_id" INTEGER,

    CONSTRAINT "m_hak_akses_rule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_kategori_brand_nama_kategori_key" ON "m_kategori_brand"("nama_kategori");

-- CreateIndex
CREATE UNIQUE INDEX "m_bidang_brand_nama_bidang_key" ON "m_bidang_brand"("nama_bidang");

-- CreateIndex
CREATE INDEX "m_brand_m_bidang_brand_id_idx" ON "m_brand"("m_bidang_brand_id");

-- CreateIndex
CREATE INDEX "m_brand_m_kategori_brand_id_idx" ON "m_brand"("m_kategori_brand_id");

-- CreateIndex
CREATE INDEX "m_hak_akses_rule_m_hak_akses_id_idx" ON "m_hak_akses_rule"("m_hak_akses_id");

-- CreateIndex
CREATE INDEX "m_hak_akses_rule_m_level_id_idx" ON "m_hak_akses_rule"("m_level_id");

-- CreateIndex
CREATE INDEX "m_hak_akses_rule_m_jabatan_id_idx" ON "m_hak_akses_rule"("m_jabatan_id");

-- AddForeignKey
ALTER TABLE "m_brand" ADD CONSTRAINT "m_brand_m_bidang_brand_id_fkey" FOREIGN KEY ("m_bidang_brand_id") REFERENCES "m_bidang_brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_brand" ADD CONSTRAINT "m_brand_m_kategori_brand_id_fkey" FOREIGN KEY ("m_kategori_brand_id") REFERENCES "m_kategori_brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_hak_akses_rule" ADD CONSTRAINT "m_hak_akses_rule_m_hak_akses_id_fkey" FOREIGN KEY ("m_hak_akses_id") REFERENCES "m_hak_akses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_hak_akses_rule" ADD CONSTRAINT "m_hak_akses_rule_m_level_id_fkey" FOREIGN KEY ("m_level_id") REFERENCES "m_level"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_hak_akses_rule" ADD CONSTRAINT "m_hak_akses_rule_m_jabatan_id_fkey" FOREIGN KEY ("m_jabatan_id") REFERENCES "m_jabatan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
