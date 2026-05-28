import { PrismaClient } from "@prisma/client";

export async function seedRapatNotulen(prisma: PrismaClient) {
  console.log("Seeding Rapat & Notulen...");

  // 1. Dapatkan user utama
  const deland = await prisma.m_user.findUnique({ where: { username: "deland" } });
  const kezia = await prisma.m_user.findUnique({ where: { username: "kezia" } });
  const alif = await prisma.m_user.findUnique({ where: { username: "alif" } });
  const adia = await prisma.m_user.findUnique({ where: { username: "adia" } });

  if (!deland || !kezia || !alif) {
    console.warn("⚠️ User inti (deland, kezia, alif) tidak ditemukan. Melewati seed Rapat & Notulen.");
    return;
  }

  // 2. Kategori Rapat
  const katKoordinasi = await prisma.m_kategori_rapat.upsert({
    where: { nama_kategori: "Rapat Koordinasi" },
    update: {},
    create: {
      nama_kategori: "Rapat Koordinasi",
      deskripsi: "Rapat koordinasi antar divisi karang taruna",
      warna_hex: "#3B82F6", // Biru
    },
  });

  const katEvaluasi = await prisma.m_kategori_rapat.upsert({
    where: { nama_kategori: "Evaluasi Bulanan" },
    update: {},
    create: {
      nama_kategori: "Evaluasi Bulanan",
      deskripsi: "Rapat evaluasi rutin setiap akhir bulan",
      warna_hex: "#10B981", // Hijau
    },
  });

  // 3. Cari atau buat Event (untuk Rapat Terkait Event)
  let existingEvent = await prisma.event.findFirst();
  if (!existingEvent) {
    console.log("Membuat dummy event untuk kebutuhan seed rapat...");
    existingEvent = await prisma.event.create({
      data: {
        m_organisasi_id: 1, // Organisasi default
        dibuat_oleh_id: deland.id,
        kode_event: "EVT-2026-001",
        nama_event: "Pesta Rakyat Kelurahan Mojosongo 2026",
        tema_event: "Membangun Kebersamaan Lewat Budaya dan Olahraga",
        deskripsi: "Festival pesta rakyat tahunan kelurahan mojosongo yang melibatkan seluruh warga.",
        jenis_event: "festival",
        status_event: "perencanaan",
        tanggal_mulai: new Date("2026-08-17T08:00:00Z"),
        tanggal_selesai: new Date("2026-08-17T22:00:00Z"),
        lokasi: "Lapangan Mojosongo",
        target_peserta: 1000,
        tujuan: ["Meningkatkan kerukunan warga", "Melestarikan kesenian lokal"],
      },
    });
  }

  // 4. Seed RAPAT 1: Terkait Event (SELESAI + Notulen FINAL)
  const rapatEvent = await prisma.m_rapat.create({
    data: {
      m_kategori_rapat_id: katKoordinasi.id,
      m_user_id: deland.id,
      event_id: existingEvent.id, // Terhubung ke event!
      judul_rapat: "Rapat Persiapan Awal Pesta Rakyat 2026",
      jenis_rapat: "KOORDINASI",
      status_rapat: "SELESAI",
      deskripsi: "Membahas pembentukan panitia inti dan koordinasi awal seksi acara dan logistik.",
      tanggal_mulai: new Date("2026-05-28T09:00:00Z"),
      tanggal_selesai: new Date("2026-05-28T11:00:00Z"),
      lokasi: "Sekretariat Karang Taruna Mojosongo",
      is_online: false,
      nomor_rapat: "SRT-RPT-2026-001",
      agendas: {
        create: [
          { urutan: 1, judul_agenda: "Pembentukan Panitia Pelaksana", durasi_menit: 45 },
          { urutan: 2, judul_agenda: "Rancangan Anggaran Awal", durasi_menit: 45 },
        ],
      },
      peserta: {
        create: [
          {
            m_user_id: deland.id,
            nama_peserta: deland.nama_lengkap,
            jabatan_peserta: "Ketua",
            status_kehadiran: "HADIR",
            is_moderator: true,
            waktu_hadir: new Date("2026-05-28T08:55:00Z"),
          },
          {
            m_user_id: kezia.id,
            nama_peserta: kezia.nama_lengkap,
            jabatan_peserta: "Sekretaris",
            status_kehadiran: "HADIR",
            is_notulis: true,
            waktu_hadir: new Date("2026-05-28T08:50:00Z"),
          },
          {
            m_user_id: alif.id,
            nama_peserta: alif.nama_lengkap,
            jabatan_peserta: "Wakil Ketua",
            status_kehadiran: "HADIR",
            waktu_hadir: new Date("2026-05-28T09:02:00Z"),
          },
        ],
      },
    },
  });

  // Buat NOTULEN untuk Rapat 1
  const notulen = await prisma.m_notulen.create({
    data: {
      m_rapat_id: rapatEvent.id,
      m_user_id: kezia.id, // Notulis
      m_approver_id: deland.id, // Disetujui Ketua
      nomor_notulen: "NOT-2026-001",
      status: "FINAL",
      pembukaan: "Rapat dibuka pukul 09.00 WIB oleh Ketua Karang Taruna Mojosongo.",
      penutupan: "Rapat ditutup pukul 11.00 WIB dengan kesepakatan rancangan panitia pelaksana.",
      kesimpulan_umum: "Panitia inti pesta rakyat resmi dibentuk. Sekretaris akan menyusun SK Kepanitiaan.",
      diajukan_pada: new Date("2026-05-28T11:15:00Z"),
      disetujui_pada: new Date("2026-05-28T12:00:00Z"),
    },
  });

  // Tambahkan Poin Bahasan Notulen
  const agendasSeed = await prisma.c_agenda_rapat.findMany({ where: { m_rapat_id: rapatEvent.id } });
  const agenda1 = agendasSeed.find((a) => a.urutan === 1);
  const agenda2 = agendasSeed.find((a) => a.urutan === 2);

  await prisma.c_poin_bahasan.createMany({
    data: [
      {
        m_notulen_id: notulen.id,
        c_agenda_rapat_id: agenda1?.id || null,
        urutan: 1,
        isi_bahasan: "Penyusunan struktur panitia inti: Ketua Panitia diusulkan Saudara Alif.",
        pembicara: deland.nama_lengkap,
      },
      {
        m_notulen_id: notulen.id,
        c_agenda_rapat_id: agenda2?.id || null,
        urutan: 2,
        isi_bahasan: "Anggaran logistik awal diajukan sebesar Rp 5.000.000 untuk perlengkapan panggung.",
        pembicara: alif.nama_lengkap,
      },
    ],
  });

  // Tambahkan Keputusan Rapat
  const keputusan = await prisma.c_keputusan_rapat.create({
    data: {
      m_notulen_id: notulen.id,
      urutan: 1,
      isi_keputusan: "Menetapkan Saudara Alif sebagai Ketua Panitia Pelaksana Pesta Rakyat 2026.",
      dasar_keputusan: "Musyawarah mufakat seluruh pengurus harian.",
      is_konsensus: true,
    },
  });

  // Tambahkan Tindak Lanjut (Action Items)
  await prisma.c_tindak_lanjut.create({
    data: {
      m_notulen_id: notulen.id,
      c_keputusan_rapat_id: keputusan.id,
      m_user_id_pic: alif.id,
      m_user_id_pembuat: kezia.id,
      judul: "Penyusunan Proposal Anggaran Rinci Pesta Rakyat",
      deskripsi: "Menyusun proposal anggaran yang rinci untuk setiap divisi dan diajukan ke bendahara kelurahan.",
      prioritas: "TINGGI",
      status: "BELUM_MULAI",
      deadline: new Date("2026-06-05T23:59:59Z"),
    },
  });


  // 5. Seed RAPAT 2: DI LUAR EVENT (TERJADWAL)
  await prisma.m_rapat.create({
    data: {
      m_kategori_rapat_id: katEvaluasi.id,
      m_user_id: deland.id,
      event_id: null, // Rapat di luar event!
      judul_rapat: "Rapat Evaluasi Kinerja Bulanan Mei 2026",
      jenis_rapat: "EVALUASI",
      status_rapat: "TERJADWAL",
      deskripsi: "Mengevaluasi program kerja bulanan yang terlaksana dan merencanakan agenda bulan berikutnya.",
      tanggal_mulai: new Date("2026-05-30T14:00:00Z"),
      tanggal_selesai: new Date("2026-05-30T16:00:00Z"),
      lokasi: "Balai Pertemuan Kelurahan Mojosongo",
      is_online: false,
      nomor_rapat: "SRT-RPT-2026-002",
      agendas: {
        create: [
          { urutan: 1, judul_agenda: "Laporan Kinerja Bulanan Harian", durasi_menit: 60 },
          { urutan: 2, judul_agenda: "Pembahasan Kas dan Keuangan", durasi_menit: 30 },
        ],
      },
      peserta: {
        create: [
          {
            m_user_id: deland.id,
            nama_peserta: deland.nama_lengkap,
            jabatan_peserta: "Ketua",
            status_kehadiran: "DIUNDANG",
            is_moderator: true,
          },
          {
            m_user_id: kezia.id,
            nama_peserta: kezia.nama_lengkap,
            jabatan_peserta: "Sekretaris",
            status_kehadiran: "DIUNDANG",
            is_notulis: true,
          },
          {
            m_user_id: alif.id,
            nama_peserta: alif.nama_lengkap,
            jabatan_peserta: "Wakil Ketua",
            status_kehadiran: "DIUNDANG",
          },
          {
            m_user_id: adia ? adia.id : null,
            nama_peserta: adia ? adia.nama_lengkap : "Koordinator SDM",
            jabatan_peserta: "Koordinator",
            status_kehadiran: "DIUNDANG",
          },
        ],
      },
    },
  });

  console.log("Seeding Rapat & Notulen berhasil selesai! ✅");
}
