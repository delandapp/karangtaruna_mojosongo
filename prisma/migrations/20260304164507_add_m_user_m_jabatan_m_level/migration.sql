-- CreateTable
CREATE TABLE "m_level" (
    "id" SERIAL NOT NULL,
    "nama_level" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_jabatan" (
    "id" SERIAL NOT NULL,
    "nama_jabatan" TEXT NOT NULL,
    "deskripsi_jabatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_jabatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_user" (
    "id" SERIAL NOT NULL,
    "m_jabatan_id" INTEGER,
    "m_level_id" INTEGER,
    "nama_lengkap" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "no_handphone" TEXT NOT NULL,
    "rt" TEXT NOT NULL,
    "rw" TEXT NOT NULL,
    "alamat" TEXT,
    "jenis_kelamin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_level_nama_level_key" ON "m_level"("nama_level");

-- CreateIndex
CREATE UNIQUE INDEX "m_jabatan_nama_jabatan_key" ON "m_jabatan"("nama_jabatan");

-- CreateIndex
CREATE UNIQUE INDEX "m_user_username_key" ON "m_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "m_user_no_handphone_key" ON "m_user"("no_handphone");

-- CreateIndex
CREATE INDEX "m_user_m_jabatan_id_idx" ON "m_user"("m_jabatan_id");

-- CreateIndex
CREATE INDEX "m_user_m_level_id_idx" ON "m_user"("m_level_id");

-- AddForeignKey
ALTER TABLE "m_user" ADD CONSTRAINT "m_user_m_jabatan_id_fkey" FOREIGN KEY ("m_jabatan_id") REFERENCES "m_jabatan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_user" ADD CONSTRAINT "m_user_m_level_id_fkey" FOREIGN KEY ("m_level_id") REFERENCES "m_level"("id") ON DELETE SET NULL ON UPDATE CASCADE;
