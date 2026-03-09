-- CreateTable
CREATE TABLE "m_jenis_surat" (
    "id" SERIAL NOT NULL,
    "nama_jenis" TEXT NOT NULL,
    "prefix_nomor" TEXT,
    "template_url" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_jenis_surat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surat" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER,
    "m_jenis_surat_id" INTEGER,
    "dibuat_oleh_id" INTEGER NOT NULL,
    "ditandatangani_oleh_id" INTEGER,
    "nomor_surat" TEXT,
    "perihal" TEXT NOT NULL,
    "tujuan_kepada" TEXT,
    "konten" TEXT,
    "url_file" TEXT,
    "arah_surat" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "tanggal_surat" TIMESTAMP(3) NOT NULL,
    "ditandatangani_pada" TIMESTAMP(3),
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dokumen" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER,
    "diunggah_oleh_id" INTEGER NOT NULL,
    "nama_dokumen" TEXT NOT NULL,
    "jenis_dokumen" TEXT NOT NULL,
    "url_file" TEXT NOT NULL,
    "ukuran_kb" INTEGER,
    "versi" INTEGER NOT NULL DEFAULT 1,
    "level_akses" TEXT NOT NULL DEFAULT 'anggota',
    "tag" JSONB,
    "catatan" TEXT,
    "diunggah_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dokumen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laporan" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER,
    "dibuat_oleh_id" INTEGER NOT NULL,
    "disetujui_oleh_id" INTEGER,
    "jenis_laporan" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "periode_mulai" TIMESTAMP(3),
    "periode_selesai" TIMESTAMP(3),
    "isi_laporan" JSONB,
    "url_file" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "catatan" TEXT,
    "disetujui_pada" TIMESTAMP(3),
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laporan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_galeri" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER,
    "diunggah_oleh_id" INTEGER NOT NULL,
    "jenis_media" TEXT NOT NULL,
    "judul" TEXT,
    "url_file" TEXT NOT NULL,
    "url_thumbnail" TEXT,
    "is_publik" BOOLEAN NOT NULL DEFAULT true,
    "is_unggulan" BOOLEAN NOT NULL DEFAULT false,
    "tag" JSONB,
    "diunggah_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_galeri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event" (
    "id" SERIAL NOT NULL,
    "m_organisasi_id" INTEGER NOT NULL,
    "dibuat_oleh_id" INTEGER NOT NULL,
    "kode_event" TEXT NOT NULL,
    "nama_event" TEXT NOT NULL,
    "tema_event" TEXT,
    "deskripsi" TEXT,
    "jenis_event" TEXT NOT NULL,
    "status_event" TEXT NOT NULL DEFAULT 'perencanaan',
    "tanggal_mulai" TIMESTAMP(3) NOT NULL,
    "tanggal_selesai" TIMESTAMP(3) NOT NULL,
    "lokasi" TEXT,
    "target_peserta" INTEGER,
    "realisasi_peserta" INTEGER,
    "banner_url" TEXT,
    "tujuan" JSONB,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anggota_panitia" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "m_jabatan_id" INTEGER,
    "divisi" TEXT NOT NULL,
    "posisi" TEXT NOT NULL,
    "deskripsi_tugas" TEXT,
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "bergabung_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anggota_panitia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rundown_acara" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "pic_id" INTEGER,
    "hari_ke" INTEGER NOT NULL,
    "urutan_no" INTEGER NOT NULL,
    "waktu_mulai" TEXT NOT NULL,
    "waktu_selesai" TEXT NOT NULL,
    "nama_kegiatan" TEXT NOT NULL,
    "keterangan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'belum',

    CONSTRAINT "rundown_acara_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tugas_event" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "ditugaskan_ke_id" INTEGER,
    "dibuat_oleh_id" INTEGER NOT NULL,
    "parent_tugas_id" INTEGER,
    "nama_tugas" TEXT NOT NULL,
    "deskripsi" TEXT,
    "prioritas" TEXT NOT NULL DEFAULT 'sedang',
    "status" TEXT NOT NULL DEFAULT 'belum_mulai',
    "batas_waktu" TIMESTAMP(3),
    "selesai_pada" TIMESTAMP(3),

    CONSTRAINT "tugas_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapat" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER,
    "dibuat_oleh_id" INTEGER NOT NULL,
    "judul" TEXT NOT NULL,
    "agenda" JSONB,
    "tanggal_rapat" TIMESTAMP(3) NOT NULL,
    "lokasi" TEXT,
    "notulensi" TEXT,
    "action_items" JSONB,
    "status" TEXT NOT NULL DEFAULT 'dijadwalkan',

    CONSTRAINT "rapat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survei_kepuasan" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "dibuat_oleh_id" INTEGER NOT NULL,
    "jenis_survei" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "pertanyaan" JSONB NOT NULL,
    "buka_pada" TIMESTAMP(3) NOT NULL,
    "tutup_pada" TIMESTAMP(3) NOT NULL,
    "total_respons" INTEGER NOT NULL DEFAULT 0,
    "rata_rata_nilai" DECIMAL(4,2),
    "skor_nps" DECIMAL(5,2),
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survei_kepuasan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respon_survei" (
    "id" SERIAL NOT NULL,
    "survei_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "nama_responden" TEXT,
    "usia_responden" INTEGER,
    "tipe_responden" TEXT,
    "jawaban" JSONB NOT NULL,
    "nilai_keseluruhan" DECIMAL(4,2),
    "nilai_nps" INTEGER,
    "is_anonim" BOOLEAN NOT NULL DEFAULT false,
    "dikirim_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "respon_survei_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saran_masukan" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER,
    "user_id" INTEGER,
    "ditangani_oleh_id" INTEGER,
    "kategori" TEXT NOT NULL,
    "subjek" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "url_lampiran" TEXT,
    "nama_pengirim" TEXT,
    "is_anonim" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'diterima',
    "balasan_admin" TEXT,
    "dibalas_pada" TIMESTAMP(3),
    "dikirim_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saran_masukan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anggaran" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "dibuat_oleh_id" INTEGER NOT NULL,
    "disetujui_oleh_id" INTEGER,
    "skenario" TEXT NOT NULL DEFAULT 'moderat',
    "versi" INTEGER NOT NULL DEFAULT 1,
    "total_pemasukan_rencana" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_pengeluaran_rencana" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_pemasukan_realisasi" DECIMAL(15,2),
    "total_pengeluaran_realisasi" DECIMAL(15,2),
    "persen_cadangan" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "catatan" TEXT,
    "disetujui_pada" TIMESTAMP(3),

    CONSTRAINT "anggaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_anggaran" (
    "id" SERIAL NOT NULL,
    "anggaran_id" INTEGER NOT NULL,
    "jenis_item" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "kode_item" TEXT,
    "deskripsi" TEXT NOT NULL,
    "jumlah_satuan" INTEGER NOT NULL DEFAULT 1,
    "harga_satuan_rencana" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_rencana" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_realisasi" DECIMAL(15,2),
    "catatan" TEXT,

    CONSTRAINT "item_anggaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaksi_keuangan" (
    "id" SERIAL NOT NULL,
    "anggaran_id" INTEGER NOT NULL,
    "item_anggaran_id" INTEGER,
    "dicatat_oleh_id" INTEGER NOT NULL,
    "disetujui_oleh_id" INTEGER,
    "nomor_transaksi" TEXT NOT NULL,
    "jenis_transaksi" TEXT NOT NULL,
    "jumlah" DECIMAL(15,2) NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "bukti_url" TEXT,
    "tanggal_transaksi" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'menunggu_persetujuan',
    "catatan" TEXT,
    "disetujui_pada" TIMESTAMP(3),
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaksi_keuangan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_vendor" (
    "id" SERIAL NOT NULL,
    "nama_vendor" TEXT NOT NULL,
    "jenis_vendor" TEXT NOT NULL,
    "nama_kontak" TEXT,
    "no_handphone" TEXT,
    "alamat" TEXT,
    "penilaian" DECIMAL(3,1),
    "catatan" TEXT,
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_venue" (
    "id" SERIAL NOT NULL,
    "nama_venue" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "kapasitas" INTEGER,
    "luas_m2" DECIMAL(10,2),
    "fasilitas" JSONB,
    "harga_per_hari" DECIMAL(12,2),
    "info_kontak" JSONB,
    "foto_url" JSONB,
    "penilaian" DECIMAL(3,1),
    "catatan" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_inventaris" (
    "id" SERIAL NOT NULL,
    "kode_aset" TEXT NOT NULL,
    "nama_aset" TEXT NOT NULL,
    "kategori_aset" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "kondisi" TEXT NOT NULL,
    "tanggal_beli" TIMESTAMP(3),
    "harga_beli" DECIMAL(12,2),
    "lokasi_simpan" TEXT,
    "foto_url" TEXT,
    "catatan" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_inventaris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_vendor" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "m_vendor_id" INTEGER NOT NULL,
    "item_disewa" TEXT NOT NULL,
    "tanggal_pakai" TIMESTAMP(3) NOT NULL,
    "tanggal_kembali" TIMESTAMP(3),
    "harga_sewa" DECIMAL(12,2),
    "dp_dibayar" DECIMAL(12,2),
    "status_bayar" TEXT NOT NULL DEFAULT 'belum',
    "url_kontrak" TEXT,
    "catatan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'dipesan',

    CONSTRAINT "event_vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_venue" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "m_venue_id" INTEGER NOT NULL,
    "tanggal_booking_mulai" TIMESTAMP(3) NOT NULL,
    "tanggal_booking_selesai" TIMESTAMP(3) NOT NULL,
    "biaya_sewa" DECIMAL(12,2),
    "url_denah_layout" TEXT,
    "url_dokumen_izin" TEXT,
    "catatan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'dipesan',

    CONSTRAINT "event_venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_organisasi" (
    "id" SERIAL NOT NULL,
    "nama_org" TEXT NOT NULL,
    "kelurahan" TEXT NOT NULL,
    "kecamatan" TEXT NOT NULL,
    "kota" TEXT NOT NULL,
    "provinsi" TEXT NOT NULL,
    "logo_url" TEXT,
    "visi" TEXT,
    "misi" TEXT,
    "no_handphone" TEXT,
    "email" TEXT,
    "alamat" TEXT,
    "media_sosial" JSONB,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_organisasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kategori_pendaftaran" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "nama_kategori" TEXT NOT NULL,
    "jenjang" TEXT,
    "kuota" INTEGER,
    "biaya_daftar" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "field_formulir" JSONB,
    "daftar_buka" TIMESTAMP(3) NOT NULL,
    "daftar_tutup" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kategori_pendaftaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pendaftaran" (
    "id" SERIAL NOT NULL,
    "kategori_pendaftaran_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "nomor_daftar" TEXT NOT NULL,
    "nama_peserta" TEXT NOT NULL,
    "hp_peserta" TEXT,
    "asal_sekolah_instansi" TEXT,
    "data_formulir" JSONB,
    "status" TEXT NOT NULL DEFAULT 'mendaftar',
    "status_kehadiran" TEXT,
    "catatan_admin" TEXT,
    "didaftarkan_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pendaftaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hasil_lomba" (
    "id" SERIAL NOT NULL,
    "pendaftaran_id" INTEGER NOT NULL,
    "kategori_pendaftaran_id" INTEGER NOT NULL,
    "juri_id" INTEGER,
    "peringkat" INTEGER,
    "nilai" DECIMAL(8,2),
    "judul_prestasi" TEXT,
    "nilai_hadiah" DECIMAL(12,2),
    "catatan_juri" TEXT,

    CONSTRAINT "hasil_lomba_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_kategori_berita" (
    "id" SERIAL NOT NULL,
    "nama_kategori" TEXT NOT NULL,
    "slug_kategori" TEXT NOT NULL,
    "deskripsi" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_kategori_berita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "berita" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER,
    "m_kategori_berita_id" INTEGER,
    "penulis_id" INTEGER NOT NULL,
    "judul" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "konten" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "jumlah_tayang" INTEGER NOT NULL DEFAULT 0,
    "dijadwalkan_pada" TIMESTAMP(3),
    "diterbitkan_pada" TIMESTAMP(3),
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "berita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kalender_konten" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "ditugaskan_ke_id" INTEGER,
    "platform" TEXT NOT NULL,
    "jenis_konten" TEXT NOT NULL,
    "caption" TEXT,
    "url_media" TEXT,
    "hashtag" TEXT,
    "dijadwalkan_pada" TIMESTAMP(3),
    "diterbitkan_pada" TIMESTAMP(3),
    "reach" INTEGER,
    "engagement" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ide',
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kalender_konten_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifikasi" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "event_id" INTEGER,
    "jenis_notif" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "tabel_rujukan" TEXT,
    "id_rujukan" INTEGER,
    "sudah_dibaca" BOOLEAN NOT NULL DEFAULT false,
    "dibaca_pada" TIMESTAMP(3),
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifikasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_audit" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "aksi" TEXT NOT NULL,
    "nama_tabel" TEXT NOT NULL,
    "id_record" INTEGER,
    "data_lama" JSONB,
    "data_baru" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "keterangan" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_kategori_sponsor" (
    "id" SERIAL NOT NULL,
    "nama_kategori" TEXT NOT NULL,
    "deskripsi_kategori" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_kategori_sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_sponsor" (
    "id" SERIAL NOT NULL,
    "m_kategori_sponsor_id" INTEGER,
    "nama_perusahaan" TEXT NOT NULL,
    "nama_kontak" TEXT,
    "no_handphone" TEXT,
    "email" TEXT,
    "alamat" TEXT,
    "logo_url" TEXT,
    "instagram" TEXT,
    "website" TEXT,
    "total_disponsori" DECIMAL(15,2),
    "catatan" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_sponsor" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "m_sponsor_id" INTEGER NOT NULL,
    "ditangani_oleh_id" INTEGER,
    "tier" TEXT NOT NULL,
    "jenis_kontribusi" TEXT NOT NULL,
    "jumlah_disepakati" DECIMAL(15,2),
    "jumlah_diterima" DECIMAL(15,2),
    "deskripsi_inkind" TEXT,
    "benefit_disepakati" JSONB,
    "benefit_terealisasi" JSONB,
    "status_pipeline" TEXT NOT NULL DEFAULT 'prospek',
    "url_mou" TEXT,
    "dikonfirmasi_pada" TIMESTAMP(3),
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_sponsor" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "m_sponsor_id" INTEGER NOT NULL,
    "dikirim_oleh_id" INTEGER NOT NULL,
    "tier_diusulkan" TEXT NOT NULL,
    "url_file_proposal" TEXT,
    "dikirim_pada" TIMESTAMP(3),
    "followup_pada" TIMESTAMP(3),
    "respons" TEXT,
    "catatan" TEXT,
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proposal_sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jenis_tiket" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "nama_tiket" TEXT NOT NULL,
    "kategori_tiket" TEXT NOT NULL,
    "harga" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "kuota" INTEGER NOT NULL,
    "terjual" INTEGER NOT NULL DEFAULT 0,
    "keuntungan" JSONB,
    "penjualan_buka" TIMESTAMP(3) NOT NULL,
    "penjualan_tutup" TIMESTAMP(3) NOT NULL,
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "jenis_tiket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiket_order" (
    "id" SERIAL NOT NULL,
    "jenis_tiket_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "nomor_order" TEXT NOT NULL,
    "nama_pembeli" TEXT NOT NULL,
    "email_pembeli" TEXT NOT NULL,
    "hp_pembeli" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "total_harga" DECIMAL(12,2) NOT NULL,
    "status_bayar" TEXT NOT NULL DEFAULT 'menunggu',
    "metode_bayar" TEXT,
    "bukti_bayar_url" TEXT,
    "dibayar_pada" TIMESTAMP(3),
    "dibuat_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui_pada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tiket_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tiket_terbit" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "dicek_oleh_id" INTEGER,
    "kode_tiket" TEXT NOT NULL,
    "qr_code" TEXT NOT NULL,
    "nama_pemegang" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aktif',
    "checkin_pada" TIMESTAMP(3),
    "diterbitkan_pada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tiket_terbit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_jenis_surat_nama_jenis_key" ON "m_jenis_surat"("nama_jenis");

-- CreateIndex
CREATE UNIQUE INDEX "surat_nomor_surat_key" ON "surat"("nomor_surat");

-- CreateIndex
CREATE INDEX "surat_event_id_idx" ON "surat"("event_id");

-- CreateIndex
CREATE INDEX "surat_m_jenis_surat_id_idx" ON "surat"("m_jenis_surat_id");

-- CreateIndex
CREATE INDEX "surat_dibuat_oleh_id_idx" ON "surat"("dibuat_oleh_id");

-- CreateIndex
CREATE INDEX "surat_ditandatangani_oleh_id_idx" ON "surat"("ditandatangani_oleh_id");

-- CreateIndex
CREATE INDEX "surat_status_idx" ON "surat"("status");

-- CreateIndex
CREATE INDEX "surat_arah_surat_idx" ON "surat"("arah_surat");

-- CreateIndex
CREATE INDEX "dokumen_event_id_idx" ON "dokumen"("event_id");

-- CreateIndex
CREATE INDEX "dokumen_diunggah_oleh_id_idx" ON "dokumen"("diunggah_oleh_id");

-- CreateIndex
CREATE INDEX "dokumen_jenis_dokumen_idx" ON "dokumen"("jenis_dokumen");

-- CreateIndex
CREATE INDEX "laporan_event_id_idx" ON "laporan"("event_id");

-- CreateIndex
CREATE INDEX "laporan_dibuat_oleh_id_idx" ON "laporan"("dibuat_oleh_id");

-- CreateIndex
CREATE INDEX "laporan_disetujui_oleh_id_idx" ON "laporan"("disetujui_oleh_id");

-- CreateIndex
CREATE INDEX "laporan_status_idx" ON "laporan"("status");

-- CreateIndex
CREATE INDEX "media_galeri_event_id_idx" ON "media_galeri"("event_id");

-- CreateIndex
CREATE INDEX "media_galeri_diunggah_oleh_id_idx" ON "media_galeri"("diunggah_oleh_id");

-- CreateIndex
CREATE INDEX "media_galeri_is_publik_idx" ON "media_galeri"("is_publik");

-- CreateIndex
CREATE INDEX "media_galeri_is_unggulan_idx" ON "media_galeri"("is_unggulan");

-- CreateIndex
CREATE UNIQUE INDEX "event_kode_event_key" ON "event"("kode_event");

-- CreateIndex
CREATE INDEX "event_m_organisasi_id_idx" ON "event"("m_organisasi_id");

-- CreateIndex
CREATE INDEX "event_dibuat_oleh_id_idx" ON "event"("dibuat_oleh_id");

-- CreateIndex
CREATE INDEX "event_status_event_idx" ON "event"("status_event");

-- CreateIndex
CREATE INDEX "event_tanggal_mulai_tanggal_selesai_idx" ON "event"("tanggal_mulai", "tanggal_selesai");

-- CreateIndex
CREATE INDEX "anggota_panitia_event_id_idx" ON "anggota_panitia"("event_id");

-- CreateIndex
CREATE INDEX "anggota_panitia_user_id_idx" ON "anggota_panitia"("user_id");

-- CreateIndex
CREATE INDEX "anggota_panitia_m_jabatan_id_idx" ON "anggota_panitia"("m_jabatan_id");

-- CreateIndex
CREATE UNIQUE INDEX "anggota_panitia_event_id_user_id_key" ON "anggota_panitia"("event_id", "user_id");

-- CreateIndex
CREATE INDEX "rundown_acara_event_id_idx" ON "rundown_acara"("event_id");

-- CreateIndex
CREATE INDEX "rundown_acara_pic_id_idx" ON "rundown_acara"("pic_id");

-- CreateIndex
CREATE INDEX "rundown_acara_event_id_hari_ke_urutan_no_idx" ON "rundown_acara"("event_id", "hari_ke", "urutan_no");

-- CreateIndex
CREATE INDEX "tugas_event_event_id_idx" ON "tugas_event"("event_id");

-- CreateIndex
CREATE INDEX "tugas_event_ditugaskan_ke_id_idx" ON "tugas_event"("ditugaskan_ke_id");

-- CreateIndex
CREATE INDEX "tugas_event_dibuat_oleh_id_idx" ON "tugas_event"("dibuat_oleh_id");

-- CreateIndex
CREATE INDEX "tugas_event_parent_tugas_id_idx" ON "tugas_event"("parent_tugas_id");

-- CreateIndex
CREATE INDEX "tugas_event_status_idx" ON "tugas_event"("status");

-- CreateIndex
CREATE INDEX "rapat_event_id_idx" ON "rapat"("event_id");

-- CreateIndex
CREATE INDEX "rapat_dibuat_oleh_id_idx" ON "rapat"("dibuat_oleh_id");

-- CreateIndex
CREATE INDEX "rapat_tanggal_rapat_idx" ON "rapat"("tanggal_rapat");

-- CreateIndex
CREATE INDEX "survei_kepuasan_event_id_idx" ON "survei_kepuasan"("event_id");

-- CreateIndex
CREATE INDEX "survei_kepuasan_dibuat_oleh_id_idx" ON "survei_kepuasan"("dibuat_oleh_id");

-- CreateIndex
CREATE INDEX "survei_kepuasan_is_aktif_idx" ON "survei_kepuasan"("is_aktif");

-- CreateIndex
CREATE INDEX "respon_survei_survei_id_idx" ON "respon_survei"("survei_id");

-- CreateIndex
CREATE INDEX "respon_survei_user_id_idx" ON "respon_survei"("user_id");

-- CreateIndex
CREATE INDEX "saran_masukan_event_id_idx" ON "saran_masukan"("event_id");

-- CreateIndex
CREATE INDEX "saran_masukan_user_id_idx" ON "saran_masukan"("user_id");

-- CreateIndex
CREATE INDEX "saran_masukan_ditangani_oleh_id_idx" ON "saran_masukan"("ditangani_oleh_id");

-- CreateIndex
CREATE INDEX "saran_masukan_status_idx" ON "saran_masukan"("status");

-- CreateIndex
CREATE INDEX "saran_masukan_kategori_idx" ON "saran_masukan"("kategori");

-- CreateIndex
CREATE INDEX "anggaran_event_id_idx" ON "anggaran"("event_id");

-- CreateIndex
CREATE INDEX "anggaran_dibuat_oleh_id_idx" ON "anggaran"("dibuat_oleh_id");

-- CreateIndex
CREATE INDEX "anggaran_disetujui_oleh_id_idx" ON "anggaran"("disetujui_oleh_id");

-- CreateIndex
CREATE INDEX "anggaran_status_idx" ON "anggaran"("status");

-- CreateIndex
CREATE UNIQUE INDEX "anggaran_event_id_skenario_versi_key" ON "anggaran"("event_id", "skenario", "versi");

-- CreateIndex
CREATE INDEX "item_anggaran_anggaran_id_idx" ON "item_anggaran"("anggaran_id");

-- CreateIndex
CREATE INDEX "item_anggaran_jenis_item_idx" ON "item_anggaran"("jenis_item");

-- CreateIndex
CREATE UNIQUE INDEX "transaksi_keuangan_nomor_transaksi_key" ON "transaksi_keuangan"("nomor_transaksi");

-- CreateIndex
CREATE INDEX "transaksi_keuangan_anggaran_id_idx" ON "transaksi_keuangan"("anggaran_id");

-- CreateIndex
CREATE INDEX "transaksi_keuangan_item_anggaran_id_idx" ON "transaksi_keuangan"("item_anggaran_id");

-- CreateIndex
CREATE INDEX "transaksi_keuangan_dicatat_oleh_id_idx" ON "transaksi_keuangan"("dicatat_oleh_id");

-- CreateIndex
CREATE INDEX "transaksi_keuangan_disetujui_oleh_id_idx" ON "transaksi_keuangan"("disetujui_oleh_id");

-- CreateIndex
CREATE INDEX "transaksi_keuangan_status_idx" ON "transaksi_keuangan"("status");

-- CreateIndex
CREATE INDEX "transaksi_keuangan_tanggal_transaksi_idx" ON "transaksi_keuangan"("tanggal_transaksi");

-- CreateIndex
CREATE UNIQUE INDEX "m_inventaris_kode_aset_key" ON "m_inventaris"("kode_aset");

-- CreateIndex
CREATE INDEX "event_vendor_event_id_idx" ON "event_vendor"("event_id");

-- CreateIndex
CREATE INDEX "event_vendor_m_vendor_id_idx" ON "event_vendor"("m_vendor_id");

-- CreateIndex
CREATE INDEX "event_venue_event_id_idx" ON "event_venue"("event_id");

-- CreateIndex
CREATE INDEX "event_venue_m_venue_id_idx" ON "event_venue"("m_venue_id");

-- CreateIndex
CREATE INDEX "kategori_pendaftaran_event_id_idx" ON "kategori_pendaftaran"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "pendaftaran_nomor_daftar_key" ON "pendaftaran"("nomor_daftar");

-- CreateIndex
CREATE INDEX "pendaftaran_kategori_pendaftaran_id_idx" ON "pendaftaran"("kategori_pendaftaran_id");

-- CreateIndex
CREATE INDEX "pendaftaran_user_id_idx" ON "pendaftaran"("user_id");

-- CreateIndex
CREATE INDEX "pendaftaran_status_idx" ON "pendaftaran"("status");

-- CreateIndex
CREATE INDEX "hasil_lomba_pendaftaran_id_idx" ON "hasil_lomba"("pendaftaran_id");

-- CreateIndex
CREATE INDEX "hasil_lomba_kategori_pendaftaran_id_idx" ON "hasil_lomba"("kategori_pendaftaran_id");

-- CreateIndex
CREATE INDEX "hasil_lomba_juri_id_idx" ON "hasil_lomba"("juri_id");

-- CreateIndex
CREATE UNIQUE INDEX "m_kategori_berita_nama_kategori_key" ON "m_kategori_berita"("nama_kategori");

-- CreateIndex
CREATE UNIQUE INDEX "m_kategori_berita_slug_kategori_key" ON "m_kategori_berita"("slug_kategori");

-- CreateIndex
CREATE UNIQUE INDEX "berita_slug_key" ON "berita"("slug");

-- CreateIndex
CREATE INDEX "berita_event_id_idx" ON "berita"("event_id");

-- CreateIndex
CREATE INDEX "berita_m_kategori_berita_id_idx" ON "berita"("m_kategori_berita_id");

-- CreateIndex
CREATE INDEX "berita_penulis_id_idx" ON "berita"("penulis_id");

-- CreateIndex
CREATE INDEX "berita_status_idx" ON "berita"("status");

-- CreateIndex
CREATE INDEX "berita_slug_idx" ON "berita"("slug");

-- CreateIndex
CREATE INDEX "kalender_konten_event_id_idx" ON "kalender_konten"("event_id");

-- CreateIndex
CREATE INDEX "kalender_konten_ditugaskan_ke_id_idx" ON "kalender_konten"("ditugaskan_ke_id");

-- CreateIndex
CREATE INDEX "kalender_konten_status_idx" ON "kalender_konten"("status");

-- CreateIndex
CREATE INDEX "kalender_konten_platform_idx" ON "kalender_konten"("platform");

-- CreateIndex
CREATE INDEX "notifikasi_user_id_idx" ON "notifikasi"("user_id");

-- CreateIndex
CREATE INDEX "notifikasi_event_id_idx" ON "notifikasi"("event_id");

-- CreateIndex
CREATE INDEX "notifikasi_sudah_dibaca_idx" ON "notifikasi"("sudah_dibaca");

-- CreateIndex
CREATE INDEX "notifikasi_dibuat_pada_idx" ON "notifikasi"("dibuat_pada");

-- CreateIndex
CREATE INDEX "log_audit_user_id_idx" ON "log_audit"("user_id");

-- CreateIndex
CREATE INDEX "log_audit_nama_tabel_idx" ON "log_audit"("nama_tabel");

-- CreateIndex
CREATE INDEX "log_audit_aksi_idx" ON "log_audit"("aksi");

-- CreateIndex
CREATE INDEX "log_audit_dibuat_pada_idx" ON "log_audit"("dibuat_pada");

-- CreateIndex
CREATE UNIQUE INDEX "m_kategori_sponsor_nama_kategori_key" ON "m_kategori_sponsor"("nama_kategori");

-- CreateIndex
CREATE INDEX "m_sponsor_m_kategori_sponsor_id_idx" ON "m_sponsor"("m_kategori_sponsor_id");

-- CreateIndex
CREATE INDEX "event_sponsor_event_id_idx" ON "event_sponsor"("event_id");

-- CreateIndex
CREATE INDEX "event_sponsor_m_sponsor_id_idx" ON "event_sponsor"("m_sponsor_id");

-- CreateIndex
CREATE INDEX "event_sponsor_ditangani_oleh_id_idx" ON "event_sponsor"("ditangani_oleh_id");

-- CreateIndex
CREATE INDEX "event_sponsor_status_pipeline_idx" ON "event_sponsor"("status_pipeline");

-- CreateIndex
CREATE UNIQUE INDEX "event_sponsor_event_id_m_sponsor_id_key" ON "event_sponsor"("event_id", "m_sponsor_id");

-- CreateIndex
CREATE INDEX "proposal_sponsor_event_id_idx" ON "proposal_sponsor"("event_id");

-- CreateIndex
CREATE INDEX "proposal_sponsor_m_sponsor_id_idx" ON "proposal_sponsor"("m_sponsor_id");

-- CreateIndex
CREATE INDEX "proposal_sponsor_dikirim_oleh_id_idx" ON "proposal_sponsor"("dikirim_oleh_id");

-- CreateIndex
CREATE INDEX "jenis_tiket_event_id_idx" ON "jenis_tiket"("event_id");

-- CreateIndex
CREATE INDEX "jenis_tiket_is_aktif_idx" ON "jenis_tiket"("is_aktif");

-- CreateIndex
CREATE UNIQUE INDEX "tiket_order_nomor_order_key" ON "tiket_order"("nomor_order");

-- CreateIndex
CREATE INDEX "tiket_order_jenis_tiket_id_idx" ON "tiket_order"("jenis_tiket_id");

-- CreateIndex
CREATE INDEX "tiket_order_user_id_idx" ON "tiket_order"("user_id");

-- CreateIndex
CREATE INDEX "tiket_order_status_bayar_idx" ON "tiket_order"("status_bayar");

-- CreateIndex
CREATE INDEX "tiket_order_nomor_order_idx" ON "tiket_order"("nomor_order");

-- CreateIndex
CREATE UNIQUE INDEX "tiket_terbit_kode_tiket_key" ON "tiket_terbit"("kode_tiket");

-- CreateIndex
CREATE INDEX "tiket_terbit_order_id_idx" ON "tiket_terbit"("order_id");

-- CreateIndex
CREATE INDEX "tiket_terbit_dicek_oleh_id_idx" ON "tiket_terbit"("dicek_oleh_id");

-- CreateIndex
CREATE INDEX "tiket_terbit_status_idx" ON "tiket_terbit"("status");

-- AddForeignKey
ALTER TABLE "surat" ADD CONSTRAINT "surat_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surat" ADD CONSTRAINT "surat_m_jenis_surat_id_fkey" FOREIGN KEY ("m_jenis_surat_id") REFERENCES "m_jenis_surat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surat" ADD CONSTRAINT "surat_dibuat_oleh_id_fkey" FOREIGN KEY ("dibuat_oleh_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surat" ADD CONSTRAINT "surat_ditandatangani_oleh_id_fkey" FOREIGN KEY ("ditandatangani_oleh_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen" ADD CONSTRAINT "dokumen_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dokumen" ADD CONSTRAINT "dokumen_diunggah_oleh_id_fkey" FOREIGN KEY ("diunggah_oleh_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan" ADD CONSTRAINT "laporan_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan" ADD CONSTRAINT "laporan_dibuat_oleh_id_fkey" FOREIGN KEY ("dibuat_oleh_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan" ADD CONSTRAINT "laporan_disetujui_oleh_id_fkey" FOREIGN KEY ("disetujui_oleh_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_galeri" ADD CONSTRAINT "media_galeri_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_galeri" ADD CONSTRAINT "media_galeri_diunggah_oleh_id_fkey" FOREIGN KEY ("diunggah_oleh_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_m_organisasi_id_fkey" FOREIGN KEY ("m_organisasi_id") REFERENCES "m_organisasi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_dibuat_oleh_id_fkey" FOREIGN KEY ("dibuat_oleh_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggota_panitia" ADD CONSTRAINT "anggota_panitia_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggota_panitia" ADD CONSTRAINT "anggota_panitia_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggota_panitia" ADD CONSTRAINT "anggota_panitia_m_jabatan_id_fkey" FOREIGN KEY ("m_jabatan_id") REFERENCES "m_jabatan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rundown_acara" ADD CONSTRAINT "rundown_acara_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rundown_acara" ADD CONSTRAINT "rundown_acara_pic_id_fkey" FOREIGN KEY ("pic_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas_event" ADD CONSTRAINT "tugas_event_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas_event" ADD CONSTRAINT "tugas_event_ditugaskan_ke_id_fkey" FOREIGN KEY ("ditugaskan_ke_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas_event" ADD CONSTRAINT "tugas_event_dibuat_oleh_id_fkey" FOREIGN KEY ("dibuat_oleh_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tugas_event" ADD CONSTRAINT "tugas_event_parent_tugas_id_fkey" FOREIGN KEY ("parent_tugas_id") REFERENCES "tugas_event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapat" ADD CONSTRAINT "rapat_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapat" ADD CONSTRAINT "rapat_dibuat_oleh_id_fkey" FOREIGN KEY ("dibuat_oleh_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survei_kepuasan" ADD CONSTRAINT "survei_kepuasan_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survei_kepuasan" ADD CONSTRAINT "survei_kepuasan_dibuat_oleh_id_fkey" FOREIGN KEY ("dibuat_oleh_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respon_survei" ADD CONSTRAINT "respon_survei_survei_id_fkey" FOREIGN KEY ("survei_id") REFERENCES "survei_kepuasan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respon_survei" ADD CONSTRAINT "respon_survei_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saran_masukan" ADD CONSTRAINT "saran_masukan_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saran_masukan" ADD CONSTRAINT "saran_masukan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saran_masukan" ADD CONSTRAINT "saran_masukan_ditangani_oleh_id_fkey" FOREIGN KEY ("ditangani_oleh_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggaran" ADD CONSTRAINT "anggaran_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggaran" ADD CONSTRAINT "anggaran_dibuat_oleh_id_fkey" FOREIGN KEY ("dibuat_oleh_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggaran" ADD CONSTRAINT "anggaran_disetujui_oleh_id_fkey" FOREIGN KEY ("disetujui_oleh_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_anggaran" ADD CONSTRAINT "item_anggaran_anggaran_id_fkey" FOREIGN KEY ("anggaran_id") REFERENCES "anggaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi_keuangan" ADD CONSTRAINT "transaksi_keuangan_anggaran_id_fkey" FOREIGN KEY ("anggaran_id") REFERENCES "anggaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi_keuangan" ADD CONSTRAINT "transaksi_keuangan_item_anggaran_id_fkey" FOREIGN KEY ("item_anggaran_id") REFERENCES "item_anggaran"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi_keuangan" ADD CONSTRAINT "transaksi_keuangan_dicatat_oleh_id_fkey" FOREIGN KEY ("dicatat_oleh_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi_keuangan" ADD CONSTRAINT "transaksi_keuangan_disetujui_oleh_id_fkey" FOREIGN KEY ("disetujui_oleh_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_vendor" ADD CONSTRAINT "event_vendor_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_vendor" ADD CONSTRAINT "event_vendor_m_vendor_id_fkey" FOREIGN KEY ("m_vendor_id") REFERENCES "m_vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_venue" ADD CONSTRAINT "event_venue_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_venue" ADD CONSTRAINT "event_venue_m_venue_id_fkey" FOREIGN KEY ("m_venue_id") REFERENCES "m_venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kategori_pendaftaran" ADD CONSTRAINT "kategori_pendaftaran_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendaftaran" ADD CONSTRAINT "pendaftaran_kategori_pendaftaran_id_fkey" FOREIGN KEY ("kategori_pendaftaran_id") REFERENCES "kategori_pendaftaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pendaftaran" ADD CONSTRAINT "pendaftaran_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hasil_lomba" ADD CONSTRAINT "hasil_lomba_pendaftaran_id_fkey" FOREIGN KEY ("pendaftaran_id") REFERENCES "pendaftaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hasil_lomba" ADD CONSTRAINT "hasil_lomba_kategori_pendaftaran_id_fkey" FOREIGN KEY ("kategori_pendaftaran_id") REFERENCES "kategori_pendaftaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hasil_lomba" ADD CONSTRAINT "hasil_lomba_juri_id_fkey" FOREIGN KEY ("juri_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "berita" ADD CONSTRAINT "berita_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "berita" ADD CONSTRAINT "berita_m_kategori_berita_id_fkey" FOREIGN KEY ("m_kategori_berita_id") REFERENCES "m_kategori_berita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "berita" ADD CONSTRAINT "berita_penulis_id_fkey" FOREIGN KEY ("penulis_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kalender_konten" ADD CONSTRAINT "kalender_konten_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kalender_konten" ADD CONSTRAINT "kalender_konten_ditugaskan_ke_id_fkey" FOREIGN KEY ("ditugaskan_ke_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifikasi" ADD CONSTRAINT "notifikasi_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_audit" ADD CONSTRAINT "log_audit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_sponsor" ADD CONSTRAINT "m_sponsor_m_kategori_sponsor_id_fkey" FOREIGN KEY ("m_kategori_sponsor_id") REFERENCES "m_kategori_sponsor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sponsor" ADD CONSTRAINT "event_sponsor_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sponsor" ADD CONSTRAINT "event_sponsor_m_sponsor_id_fkey" FOREIGN KEY ("m_sponsor_id") REFERENCES "m_sponsor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sponsor" ADD CONSTRAINT "event_sponsor_ditangani_oleh_id_fkey" FOREIGN KEY ("ditangani_oleh_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_sponsor" ADD CONSTRAINT "proposal_sponsor_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_sponsor" ADD CONSTRAINT "proposal_sponsor_m_sponsor_id_fkey" FOREIGN KEY ("m_sponsor_id") REFERENCES "m_sponsor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_sponsor" ADD CONSTRAINT "proposal_sponsor_dikirim_oleh_id_fkey" FOREIGN KEY ("dikirim_oleh_id") REFERENCES "m_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jenis_tiket" ADD CONSTRAINT "jenis_tiket_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiket_order" ADD CONSTRAINT "tiket_order_jenis_tiket_id_fkey" FOREIGN KEY ("jenis_tiket_id") REFERENCES "jenis_tiket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiket_order" ADD CONSTRAINT "tiket_order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiket_terbit" ADD CONSTRAINT "tiket_terbit_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "tiket_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tiket_terbit" ADD CONSTRAINT "tiket_terbit_dicek_oleh_id_fkey" FOREIGN KEY ("dicek_oleh_id") REFERENCES "m_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
