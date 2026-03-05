import dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

// Gunakan DIRECT_URL (koneksi langsung ke PostgreSQL) untuk seeding,
// bukan DATABASE_URL yang mengarah ke PgBouncer.
const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


async function main() {
    console.log('Seeding database...');

    // 1. Seed Tingkatan Level
    const levels = [
        'superuser',
        'admin',
        'ketua',
        'wakil ketua',
        'seketaris',
        'bendahara',
        'koordinator',
        'anggota',
    ];

    console.log('Seeding levels...');
    for (const levelName of levels) {
        await prisma.m_level.upsert({
            where: { nama_level: levelName },
            update: {},
            create: { nama_level: levelName },
        });
    }

    // 2. Seed Jabatan
    const jabatans = [
        'Penanggung Jawab',
        'Penasehat',
        'Pembimbing',
        'Ketua',
        'Wakil Ketua',
        'Bendahara 1',
        'Bendahara 2',
        'Seketaris 1',
        'Seketaris 2',
        'Koordinator Humas 1',
        'Koordinator Humas 2',
        'Koordinator Sdm 1',
        'Koordinator Sdm 2',
        'Koordinator Keagamaan 1',
        'Koordinator Keagamaan 2',
        'Koordinator Parenkraf 1',
        'Koordinator Parenkraf 2',
        'Koordinator Olahraga 1',
        'Koordinator Olahraga 2',
    ];

    console.log('Seeding jabatans...');
    for (const jabatanName of jabatans) {
        await prisma.m_jabatan.upsert({
            where: { nama_jabatan: jabatanName },
            update: {},
            create: { nama_jabatan: jabatanName },
        });
    }

    // 3. Seed Users
    const saltRounds = 10;
    const hashPassword = await bcrypt.hash('Mojosongo2026', saltRounds);

    console.log('Seeding users...');

    // Cari ID Jabatan dan Level untuk user 1
    const pjJabatan = await prisma.m_jabatan.findUnique({
        where: { nama_jabatan: 'Penanggung Jawab' },
    });
    const superuserLevel = await prisma.m_level.findUnique({
        where: { nama_level: 'superuser' },
    });

    if (pjJabatan && superuserLevel) {
        await prisma.m_user.upsert({
            where: { username: 'kti_mojosongo' },
            update: {},
            create: {
                nama_lengkap: 'Karang Taruna Kelurahan Mojosongo',
                username: 'kti_mojosongo',
                password: hashPassword,
                no_handphone: '08979341242',
                rt: '00',
                rw: '00',
                alamat: 'Jl. Brigjend Katamso, Mojosongo, Kec. Jebres, Kota Surakarta, Jawa Tengah 57127',
                m_jabatan_id: pjJabatan.id,
                m_level_id: superuserLevel.id,
            },
        });
    }

    // Cari ID Jabatan dan Level untuk user 2
    const ketuaJabatan = await prisma.m_jabatan.findUnique({
        where: { nama_jabatan: 'Ketua' },
    });
    const ketuaLevel = await prisma.m_level.findUnique({
        where: { nama_level: 'ketua' },
    });

    if (ketuaJabatan && ketuaLevel) {
        await prisma.m_user.upsert({
            where: { username: 'deland' },
            update: {},
            create: {
                nama_lengkap: 'Muhammad Deland Arjuna Putra',
                username: 'deland',
                password: hashPassword,
                no_handphone: '085725631011',
                rt: '03',
                rw: '35',
                alamat: 'Sabrang Kulon, Kelurahan Mojosongo, Kecamatan Jebres, Kota Surakarta, Jawa Tengah 57127',
                m_jabatan_id: ketuaJabatan.id,
                m_level_id: ketuaLevel.id,
            },
        });
    }

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

