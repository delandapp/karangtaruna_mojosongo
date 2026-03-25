import { PrismaClient } from "@prisma/client";

export async function seedHakAkses(prisma: PrismaClient) {
  // 4. Seed Hak Akses & Rules Role-Based
  console.log("Seeding hak akses & rules...");

  // Bersihkan data lama agar tidak duplikat (karena m_hak_akses tidak punya unique constraint)
  await prisma.m_hak_akses_rule.deleteMany({});
  await prisma.m_hak_akses.deleteMany({});

  // Ambil semua level yang dibutuhkan sekaligus
  const [
    superuserLvl,
    ketuaLvl,
    adminLvl,
    wakilKetuaLvl,
    sekretarisLvl,
    bendaharaLvl,
    koordinatorLvl,
    anggotaLvl,
    humasJabatan,
  ] = await Promise.all([
    prisma.m_level.findUnique({ where: { nama_level: "superuser" } }),
    prisma.m_level.findUnique({ where: { nama_level: "ketua" } }),
    prisma.m_level.findUnique({ where: { nama_level: "admin" } }),
    prisma.m_level.findUnique({ where: { nama_level: "wakil ketua" } }),
    prisma.m_level.findUnique({ where: { nama_level: "seketaris" } }),
    prisma.m_level.findUnique({ where: { nama_level: "bendahara" } }),
    prisma.m_level.findUnique({ where: { nama_level: "koordinator" } }),
    prisma.m_level.findUnique({ where: { nama_level: "anggota" } }),
    prisma.m_jabatan.findUnique({ where: { nama_jabatan: "Bidang Humas" } }),
  ]);

  // Helper: buat hak akses + rules sekaligus
  const buatHakAkses = async (
    namaFitur: string,
    tipeFitur: string,
    endpoint: string,
    method: string,
    allowedLevelIds: number[],
    allowedRules?: { levelId?: number; jabatanId?: number }[],
  ) => {
    const hak = await prisma.m_hak_akses.create({
      data: {
        nama_fitur: namaFitur,
        tipe_fitur: tipeFitur,
        endpoint,
        method,
        is_all_level: false,
        is_all_jabatan: false,
      },
    });

    const rulesData: any[] = allowedLevelIds.map((levelId) => ({
      m_hak_akses_id: hak.id,
      m_level_id: levelId,
    }));

    if (allowedRules) {
      allowedRules.forEach((rule) => {
        rulesData.push({
          m_hak_akses_id: hak.id,
          m_level_id: rule.levelId,
          m_jabatan_id: rule.jabatanId,
        });
      });
    }

    await prisma.m_hak_akses_rule.createMany({
      data: rulesData,
    });
  };

  // Level ID yang digunakan untuk CRUD standar
  // superuser + ketua + admin boleh melakukan semua CRUD
  const crudLevelIds = [superuserLvl?.id, ketuaLvl?.id, adminLvl?.id].filter(
    (id): id is number => id !== undefined,
  );

  const organisasiLevelIds = crudLevelIds;

  const eventLevelIds = [
    superuserLvl?.id,
    ketuaLvl?.id,
    adminLvl?.id,
    wakilKetuaLvl?.id,
  ].filter((id): id is number => id !== undefined);

  const anggaranLevelIds = [
    superuserLvl?.id,
    ketuaLvl?.id,
    adminLvl?.id,
    wakilKetuaLvl?.id,
    sekretarisLvl?.id,
    bendaharaLvl?.id,
  ].filter((id): id is number => id !== undefined);

  const perusahaanLevelIds = [
    superuserLvl?.id,
    adminLvl?.id,
    ketuaLvl?.id,
    wakilKetuaLvl?.id,
    sekretarisLvl?.id,
    bendaharaLvl?.id,
  ].filter((id): id is number => id !== undefined);

  const humasRules = [
    { levelId: koordinatorLvl?.id, jabatanId: humasJabatan?.id },
    { levelId: anggotaLvl?.id, jabatanId: humasJabatan?.id },
  ].filter((r) => r.levelId !== undefined && r.jabatanId !== undefined) as {
    levelId?: number;
    jabatanId?: number;
  }[];

  // ── API: Users ──────────────────────────────────────────────────────────────
  const apiUsers = [
    { nama: "Read Users", tipe: "read", method: "GET" },
    { nama: "Create Users", tipe: "create", method: "POST" },
    { nama: "Update Users", tipe: "update", method: "PUT" },
    { nama: "Delete Users", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiUsers) {
    await buatHakAkses(
      item.nama,
      item.tipe,
      "/api/users",
      item.method,
      crudLevelIds,
    );
  }

  // ── API: Jabatan ─────────────────────────────────────────────────────────────
  const apiJabatan = [
    { nama: "Read Jabatan", tipe: "read", method: "GET" },
    { nama: "Create Jabatan", tipe: "create", method: "POST" },
    { nama: "Update Jabatan", tipe: "update", method: "PUT" },
    { nama: "Delete Jabatan", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiJabatan) {
    await buatHakAkses(
      item.nama,
      item.tipe,
      "/api/jabatans",
      item.method,
      crudLevelIds,
    );
  }

  // ── API: Level ───────────────────────────────────────────────────────────────
  const apiLevel = [
    { nama: "Read Level", tipe: "read", method: "GET" },
    { nama: "Create Level", tipe: "create", method: "POST" },
    { nama: "Update Level", tipe: "update", method: "PUT" },
    { nama: "Delete Level", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiLevel) {
    await buatHakAkses(
      item.nama,
      item.tipe,
      "/api/levels",
      item.method,
      crudLevelIds,
    );
  }

  // ── API: Sponsorship/Brands ──────────────────────────────────────────────────
  // superuser + ketua + admin bisa semua CRUD
  const apiBrands = [
    { nama: "Read Sponsorship Brand", tipe: "read", method: "GET" },
    { nama: "Create Sponsorship Brand", tipe: "create", method: "POST" },
    { nama: "Update Sponsorship Brand", tipe: "update", method: "PUT" },
    { nama: "Delete Sponsorship Brand", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiBrands) {
    await buatHakAkses(
      item.nama,
      item.tipe,
      "/api/sponsorship/brands",
      item.method,
      crudLevelIds,
    );
  }

  // superuser + ketua + admin bisa semua CRUD
  const apiKategoriBrands = [
    { nama: "Read Sponsorship Kategori Brand", tipe: "read", method: "GET" },
    {
      nama: "Create Sponsorship Kategori Brand",
      tipe: "create",
      method: "POST",
    },
    {
      nama: "Update Sponsorship Kategori Brand",
      tipe: "update",
      method: "PUT",
    },
    {
      nama: "Delete Sponsorship Kategori Brand",
      tipe: "delete",
      method: "DELETE",
    },
  ];
  for (const item of apiKategoriBrands) {
    await buatHakAkses(
      item.nama,
      item.tipe,
      "/api/sponsorship/kategori-brand",
      item.method,
      crudLevelIds,
    );
  }

  // superuser + ketua + admin bisa semua CRUD
  const apiBidangBrands = [
    { nama: "Read Sponsorship Bidang Brand", tipe: "read", method: "GET" },
    { nama: "Create Sponsorship Bidang Brand", tipe: "create", method: "POST" },
    { nama: "Update Sponsorship Bidang Brand", tipe: "update", method: "PUT" },
    {
      nama: "Delete Sponsorship Bidang Brand",
      tipe: "delete",
      method: "DELETE",
    },
  ];
  for (const item of apiBidangBrands) {
    await buatHakAkses(
      item.nama,
      item.tipe,
      "/api/sponsorship/bidang-brand",
      item.method,
      crudLevelIds,
    );
  }

  // ── API: Hak Akses ───────────────────────────────────────────────────────────
  // superuser + ketua + admin bisa semua CRUD hak akses
  const apiHakAkses = [
    { nama: "Read Hak Akses", tipe: "read", method: "GET" },
    { nama: "Create Hak Akses", tipe: "create", method: "POST" },
    { nama: "Update Hak Akses", tipe: "update", method: "PUT" },
    { nama: "Delete Hak Akses", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiHakAkses) {
    await buatHakAkses(
      item.nama,
      item.tipe,
      "/api/hak-akses",
      item.method,
      crudLevelIds,
    );
  }

  // ── API: Organisasi ──────────────────────────────────────────────────────────
  const apiOrganisasi = [
    { nama: "Read Organisasi", tipe: "read", method: "GET" },
    { nama: "Create Organisasi", tipe: "create", method: "POST" },
    { nama: "Update Organisasi", tipe: "update", method: "PUT" },
    { nama: "Delete Organisasi", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiOrganisasi) {
    await buatHakAkses(
      item.nama,
      item.tipe,
      "/api/organisasi",
      item.method,
      organisasiLevelIds,
    );
  }

  // ── API: Events ──────────────────────────────────────────────────────────────
  const apiEvents = [
    { nama: "Read Events", tipe: "read", method: "GET" },
    { nama: "Create Events", tipe: "create", method: "POST" },
    { nama: "Update Events", tipe: "update", method: "PUT" },
    { nama: "Delete Events", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiEvents) {
    await buatHakAkses(
      item.nama,
      item.tipe,
      "/api/events",
      item.method,
      eventLevelIds,
    );
  }

  // ── API: Anggaran ────────────────────────────────────────────────────────────
  const apiAnggaran = [
    { nama: "Read Anggaran", tipe: "read", method: "GET" },
    { nama: "Create Anggaran", tipe: "create", method: "POST" },
    { nama: "Update Anggaran", tipe: "update", method: "PUT" },
    { nama: "Delete Anggaran", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiAnggaran) {
    await buatHakAkses(
      item.nama,
      item.tipe,
      "/api/events/anggaran",
      item.method,
      anggaranLevelIds,
    );
  }

  // ── API: Sponsorship/Sektor Industri ──────────────────────────────────────────────────
  const apiSektor = [
    { nama: "Read Sektor Industri", tipe: "read", method: "GET" },
    { nama: "Create Sektor Industri", tipe: "create", method: "POST" },
    { nama: "Update Sektor Industri", tipe: "update", method: "PUT" },
    { nama: "Delete Sektor Industri", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiSektor) {
    await buatHakAkses(item.nama, item.tipe, "/api/sektor-industri", item.method, perusahaanLevelIds, humasRules);
  }

  // ── API: Sponsorship/Skala Perusahaan ────────────────────────────────────────────────
  const apiSkala = [
    { nama: "Read Skala Perusahaan", tipe: "read", method: "GET" },
    { nama: "Create Skala Perusahaan", tipe: "create", method: "POST" },
    { nama: "Update Skala Perusahaan", tipe: "update", method: "PUT" },
    { nama: "Delete Skala Perusahaan", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiSkala) {
    await buatHakAkses(item.nama, item.tipe, "/api/skala-perusahaan", item.method, perusahaanLevelIds, humasRules);
  }

  // ── API: Sponsorship/Perusahaan ──────────────────────────────────────────────────────
  const apiPerusahaan = [
    { nama: "Read Perusahaan", tipe: "read", method: "GET" },
    { nama: "Create Perusahaan", tipe: "create", method: "POST" },
    { nama: "Update Perusahaan", tipe: "update", method: "PUT" },
    { nama: "Delete Perusahaan", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiPerusahaan) {
    await buatHakAkses(item.nama, item.tipe, "/api/perusahaan", item.method, perusahaanLevelIds, humasRules);
  }

  // ── API: Panitia ─────────────────────────────────────────────────────────────
  // superuser + admin + ketua + wakil ketua dapat melakukan CRUD panitia
  const panitiaLevelIds = [
    superuserLvl?.id,
    adminLvl?.id,
    ketuaLvl?.id,
    wakilKetuaLvl?.id,
  ].filter((id): id is number => id !== undefined);

  const apiPanitia = [
    { nama: "Read Panitia",   tipe: "read",   method: "GET" },
    { nama: "Create Panitia", tipe: "create", method: "POST" },
    { nama: "Update Panitia", tipe: "update", method: "PUT" },
    { nama: "Delete Panitia", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiPanitia) {
    await buatHakAkses(
      item.nama,
      item.tipe,
      "/api/events/panitia",
      item.method,
      panitiaLevelIds,
    );
  }

  // ── API: Rundown ─────────────────────────────────────────────────────────────
  // superuser + admin + ketua + wakil ketua dapat melakukan CRUD rundown (sama spt panitia)
  const apiRundown = [
    { nama: "Read Rundown",   tipe: "read",   method: "GET" },
    { nama: "Create Rundown", tipe: "create", method: "POST" },
    { nama: "Update Rundown", tipe: "update", method: "PUT" },
    { nama: "Delete Rundown", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiRundown) {
    await buatHakAkses(
      item.nama,
      item.tipe,
      "/api/events/rundown",
      item.method,
      panitiaLevelIds, // Menggunakan panitiaLevelIds sesuai instruksi (sama dengan susunan panitia)
    );
  }

  // ── API: E-Proposal ──────────────────────────────────────────────────────────
  const apiEProposal = [
    { nama: "Read E-Proposal", tipe: "read", method: "GET" },
    { nama: "Create E-Proposal", tipe: "create", method: "POST" },
    { nama: "Update E-Proposal", tipe: "update", method: "PUT" },
    { nama: "Delete E-Proposal", tipe: "delete", method: "DELETE" },
  ];
  for (const item of apiEProposal) {
    await buatHakAkses(
      item.nama,
      item.tipe,
      "/api/eproposal",
      item.method,
      eventLevelIds, // superuser, admin, ketua, wakil ketua
    );
  }
}

