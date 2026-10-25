-- CreateTable
CREATE TABLE "m_kas" (
    "id" SERIAL NOT NULL,
    "nomor_kas" TEXT NOT NULL,
    "jenis_kas" TEXT NOT NULL,
    "sumber_tujuan" TEXT NOT NULL,
    "jumlah" DECIMAL(15,2) NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "bukti_url" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'menunggu_persetujuan',
    "catatan" TEXT,
    "dicatat_oleh_id" INTEGER NOT NULL,
    "disetujui_oleh_id" INTEGER,
    "disetujui_pada" TIMESTAMP(3),
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_kas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_linktree" (
    "id" SERIAL NOT NULL,
    "dibuat_oleh_id" INTEGER,
    "slug" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "bio" TEXT,
    "foto_profil_url" TEXT,
    "tema" TEXT NOT NULL DEFAULT 'minimal-light',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "warna_primer" TEXT,
    "warna_latar" TEXT,
    "font_kustom" TEXT,
    "bg_image_url" TEXT,
    "gaya_tombol" TEXT,
    "animasi_tombol" TEXT,
    "warna_tombol_latar" TEXT,
    "warna_tombol_teks" TEXT,
    "warna_tombol_border" TEXT,
    "border_radius_tombol" TEXT,
    "sosmed_instagram" TEXT,
    "sosmed_tiktok" TEXT,
    "sosmed_whatsapp" TEXT,
    "sosmed_facebook" TEXT,
    "sosmed_youtube" TEXT,
    "sosmed_github" TEXT,
    "sosmed_email" TEXT,
    "sosmed_telepon" TEXT,
    "meta_judul" TEXT,
    "meta_deskripsi" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "m_linktree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_link_linktree" (
    "id" SERIAL NOT NULL,
    "linktree_id" INTEGER NOT NULL,
    "judul" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ikon" TEXT,
    "warna_ikon" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "warna_latar" TEXT,
    "warna_teks" TEXT,
    "warna_border" TEXT,
    "animasi" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "c_link_linktree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_klik_linktree" (
    "id" SERIAL NOT NULL,
    "linktree_id" INTEGER NOT NULL,
    "link_id" INTEGER,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "referer" TEXT,
    "negara" TEXT,
    "perangkat" TEXT,
    "diklik_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "c_klik_linktree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_qr_code" (
    "id" SERIAL NOT NULL,
    "dibuat_oleh_id" INTEGER,
    "judul" TEXT NOT NULL,
    "konten" TEXT NOT NULL,
    "tipe_konten" TEXT NOT NULL,
    "warna_depan" TEXT NOT NULL DEFAULT '#000000',
    "warna_belakang" TEXT NOT NULL DEFAULT '#FFFFFF',
    "gaya_titik" TEXT NOT NULL DEFAULT 'square',
    "gaya_sudut_luar" TEXT NOT NULL DEFAULT 'square',
    "gaya_sudut_dalam" TEXT NOT NULL DEFAULT 'square',
    "warna_sudut_luar" TEXT,
    "warna_sudut_dalam" TEXT,
    "logo_url" TEXT,
    "logo_ukuran" INTEGER NOT NULL DEFAULT 20,
    "logo_margin" INTEGER NOT NULL DEFAULT 5,
    "logo_hapus_bg" BOOLEAN NOT NULL DEFAULT true,
    "ukuran" INTEGER NOT NULL DEFAULT 300,
    "margin" INTEGER NOT NULL DEFAULT 10,
    "level_koreksi" TEXT NOT NULL DEFAULT 'M',
    "gambar_url" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "m_qr_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_shortlink" (
    "id" SERIAL NOT NULL,
    "judul" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "url_tujuan" TEXT NOT NULL,
    "deskripsi" TEXT,
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "kedaluwarsa_pada" TIMESTAMP(3),
    "total_klik" INTEGER NOT NULL DEFAULT 0,
    "dibuat_oleh_id" INTEGER,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "m_shortlink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_shortlink_click" (
    "id" SERIAL NOT NULL,
    "shortlink_id" INTEGER NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "referer" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "c_shortlink_click_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_platform" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ikon_url" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "m_platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_akun_sosmed" (
    "id" SERIAL NOT NULL,
    "platform_id" INTEGER NOT NULL,
    "nama_akun" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'terhubung',
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "m_akun_sosmed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_konten" (
    "id" SERIAL NOT NULL,
    "akun_id" INTEGER NOT NULL,
    "judul" TEXT,
    "caption" TEXT,
    "tipe_konten" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "dijadwalkan_pada" TIMESTAMP(3),
    "diposting_pada" TIMESTAMP(3),
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "m_konten_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_media_konten" (
    "id" SERIAL NOT NULL,
    "konten_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "tipe_media" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "c_media_konten_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_jadwal_konten" (
    "id" SERIAL NOT NULL,
    "konten_id" INTEGER NOT NULL,
    "waktu_posting" TIMESTAMP(3) NOT NULL,
    "status_job" TEXT NOT NULL DEFAULT 'pending',
    "pesan_error" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "c_jadwal_konten_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_chat" (
    "id" SERIAL NOT NULL,
    "akun_id" INTEGER NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_nama" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "sudah_dibaca" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'baru',
    "platform_msg_id" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "m_chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_balasan_chat" (
    "id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "isi_balasan" TEXT NOT NULL,
    "dikirim_oleh" TEXT NOT NULL,
    "berhasil" BOOLEAN NOT NULL DEFAULT false,
    "platform_msg_id" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "c_balasan_chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_analitik" (
    "id" SERIAL NOT NULL,
    "akun_id" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "followers" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "engagement" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "komentar" INTEGER NOT NULL DEFAULT 0,
    "share" INTEGER NOT NULL DEFAULT 0,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "m_analitik_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "r_konten_platform" (
    "id" SERIAL NOT NULL,
    "konten_id" INTEGER NOT NULL,
    "platform_id" INTEGER NOT NULL,
    "external_post_id" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "r_konten_platform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_kontak_wa" (
    "id" SERIAL NOT NULL,
    "akun_id" INTEGER NOT NULL,
    "nama" TEXT NOT NULL,
    "nomor_telp" TEXT NOT NULL,
    "email" TEXT,
    "perusahaan" TEXT,
    "jabatan" TEXT,
    "grup" TEXT,
    "catatan" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "m_kontak_wa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_blazzing_wa" (
    "id" SERIAL NOT NULL,
    "akun_id" INTEGER NOT NULL,
    "nama_kempen" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "tipe" TEXT NOT NULL DEFAULT 'instant',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dijadwalkan_pada" TIMESTAMP(3),
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "m_blazzing_wa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_blazzing_penerima" (
    "id" SERIAL NOT NULL,
    "blazzing_id" INTEGER NOT NULL,
    "kontak_id" INTEGER,
    "nama" TEXT NOT NULL,
    "nomor_telp" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dikirim_pada" TIMESTAMP(3),
    "pesan_error" TEXT,
    "pesan_terformat" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,
    "dihapus_pada" TIMESTAMP(3),

    CONSTRAINT "c_blazzing_penerima_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_kas_nomor_kas_key" ON "m_kas"("nomor_kas");

-- CreateIndex
CREATE INDEX "m_kas_dicatat_oleh_id_idx" ON "m_kas"("dicatat_oleh_id");

-- CreateIndex
CREATE INDEX "m_kas_disetujui_oleh_id_idx" ON "m_kas"("disetujui_oleh_id");

-- CreateIndex
CREATE INDEX "m_kas_status_idx" ON "m_kas"("status");

-- CreateIndex
CREATE INDEX "m_kas_tanggal_idx" ON "m_kas"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "m_linktree_slug_key" ON "m_linktree"("slug");

-- CreateIndex
CREATE INDEX "m_linktree_slug_idx" ON "m_linktree"("slug");

-- CreateIndex
CREATE INDEX "m_linktree_dibuat_oleh_id_idx" ON "m_linktree"("dibuat_oleh_id");

-- CreateIndex
CREATE INDEX "c_link_linktree_linktree_id_idx" ON "c_link_linktree"("linktree_id");

-- CreateIndex
CREATE INDEX "c_klik_linktree_linktree_id_idx" ON "c_klik_linktree"("linktree_id");

-- CreateIndex
CREATE INDEX "c_klik_linktree_dibuat_pada_idx" ON "c_klik_linktree"("dibuat_pada");

-- CreateIndex
CREATE INDEX "m_qr_code_dibuat_oleh_id_idx" ON "m_qr_code"("dibuat_oleh_id");

-- CreateIndex
CREATE UNIQUE INDEX "m_shortlink_slug_key" ON "m_shortlink"("slug");

-- CreateIndex
CREATE INDEX "m_shortlink_slug_idx" ON "m_shortlink"("slug");

-- CreateIndex
CREATE INDEX "m_shortlink_is_aktif_idx" ON "m_shortlink"("is_aktif");

-- CreateIndex
CREATE INDEX "m_shortlink_dibuat_oleh_id_idx" ON "m_shortlink"("dibuat_oleh_id");

-- CreateIndex
CREATE INDEX "c_shortlink_click_shortlink_id_idx" ON "c_shortlink_click"("shortlink_id");

-- CreateIndex
CREATE INDEX "c_shortlink_click_dibuat_pada_idx" ON "c_shortlink_click"("dibuat_pada");

-- CreateIndex
CREATE UNIQUE INDEX "m_platform_slug_key" ON "m_platform"("slug");

-- AddForeignKey
ALTER TABLE "m_kas" ADD CONSTRAINT "m_kas_dicatat_oleh_id_fkey" FOREIGN KEY ("dicatat_oleh_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_kas" ADD CONSTRAINT "m_kas_disetujui_oleh_id_fkey" FOREIGN KEY ("disetujui_oleh_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_linktree" ADD CONSTRAINT "m_linktree_dibuat_oleh_id_fkey" FOREIGN KEY ("dibuat_oleh_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_link_linktree" ADD CONSTRAINT "c_link_linktree_linktree_id_fkey" FOREIGN KEY ("linktree_id") REFERENCES "m_linktree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_klik_linktree" ADD CONSTRAINT "c_klik_linktree_linktree_id_fkey" FOREIGN KEY ("linktree_id") REFERENCES "m_linktree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_qr_code" ADD CONSTRAINT "m_qr_code_dibuat_oleh_id_fkey" FOREIGN KEY ("dibuat_oleh_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_shortlink" ADD CONSTRAINT "m_shortlink_dibuat_oleh_id_fkey" FOREIGN KEY ("dibuat_oleh_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_shortlink_click" ADD CONSTRAINT "c_shortlink_click_shortlink_id_fkey" FOREIGN KEY ("shortlink_id") REFERENCES "m_shortlink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_akun_sosmed" ADD CONSTRAINT "m_akun_sosmed_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "m_platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_konten" ADD CONSTRAINT "m_konten_akun_id_fkey" FOREIGN KEY ("akun_id") REFERENCES "m_akun_sosmed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_media_konten" ADD CONSTRAINT "c_media_konten_konten_id_fkey" FOREIGN KEY ("konten_id") REFERENCES "m_konten"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_jadwal_konten" ADD CONSTRAINT "c_jadwal_konten_konten_id_fkey" FOREIGN KEY ("konten_id") REFERENCES "m_konten"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_chat" ADD CONSTRAINT "m_chat_akun_id_fkey" FOREIGN KEY ("akun_id") REFERENCES "m_akun_sosmed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_balasan_chat" ADD CONSTRAINT "c_balasan_chat_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "m_chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_analitik" ADD CONSTRAINT "m_analitik_akun_id_fkey" FOREIGN KEY ("akun_id") REFERENCES "m_akun_sosmed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_konten_platform" ADD CONSTRAINT "r_konten_platform_konten_id_fkey" FOREIGN KEY ("konten_id") REFERENCES "m_konten"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_konten_platform" ADD CONSTRAINT "r_konten_platform_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "m_platform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_kontak_wa" ADD CONSTRAINT "m_kontak_wa_akun_id_fkey" FOREIGN KEY ("akun_id") REFERENCES "m_akun_sosmed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_blazzing_wa" ADD CONSTRAINT "m_blazzing_wa_akun_id_fkey" FOREIGN KEY ("akun_id") REFERENCES "m_akun_sosmed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_blazzing_penerima" ADD CONSTRAINT "c_blazzing_penerima_blazzing_id_fkey" FOREIGN KEY ("blazzing_id") REFERENCES "m_blazzing_wa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_blazzing_penerima" ADD CONSTRAINT "c_blazzing_penerima_kontak_id_fkey" FOREIGN KEY ("kontak_id") REFERENCES "m_kontak_wa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
