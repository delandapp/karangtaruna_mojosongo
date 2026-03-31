import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { indexDocument } from "../../lib/elasticsearch";
import { ELASTIC_INDICES } from "../../lib/constants/key";

export async function seedPerusahaan(prisma: PrismaClient) {
    console.log("Seeding perusahaan...");

    const dataPath = path.join(__dirname, "../../documentation/data_json/perusahaan.json");
    const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    const provinsiCache = new Map<string, string>();
    const kotaCache = new Map<string, string>();
    const kecamatanCache = new Map<string, string>();
    const kelurahanCache = new Map<string, string>();

    for (const item of data) {
        let kode_provinsi = item.kode_wilayah_induk_provinsi;
        let kode_kota = item.kode_wilayah_induk_kota;
        let kode_kecamatan = item.kode_wilayah_induk_kecamatan;
        let kode_kelurahan = item.kode_wilayah_induk_kelurahan;

        if (!kode_provinsi && item.nama_provinsi) {
            if (provinsiCache.has(item.nama_provinsi)) {
                kode_provinsi = provinsiCache.get(item.nama_provinsi);
            } else {
                const p = await prisma.m_provinsi.findFirst({ where: { nama: item.nama_provinsi } });
                if (p?.kode_wilayah) {
                    kode_provinsi = p.kode_wilayah;
                    provinsiCache.set(item.nama_provinsi, p.kode_wilayah);
                }
            }
        }

        if (!kode_kota && item.nama_kota) {
            if (kotaCache.has(item.nama_kota)) {
                kode_kota = kotaCache.get(item.nama_kota);
            } else {
                const k = await prisma.m_kota.findFirst({ where: { nama: item.nama_kota } });
                if (k?.kode_wilayah) {
                    kode_kota = k.kode_wilayah;
                    kotaCache.set(item.nama_kota, k.kode_wilayah);
                }
            }
        }

        if (!kode_kecamatan && item.nama_kecamatan) {
            if (kecamatanCache.has(item.nama_kecamatan)) {
                kode_kecamatan = kecamatanCache.get(item.nama_kecamatan);
            } else {
                const k = await prisma.m_kecamatan.findFirst({ where: { nama: item.nama_kecamatan } });
                if (k?.kode_wilayah) {
                    kode_kecamatan = k.kode_wilayah;
                    kecamatanCache.set(item.nama_kecamatan, k.kode_wilayah);
                }
            }
        }

        if (!kode_kelurahan && item.nama_kelurahan) {
            if (kelurahanCache.has(item.nama_kelurahan)) {
                kode_kelurahan = kelurahanCache.get(item.nama_kelurahan);
            } else {
                const k = await prisma.m_kelurahan.findFirst({ where: { nama: item.nama_kelurahan } });
                if (k?.kode_wilayah) {
                    kode_kelurahan = k.kode_wilayah;
                    kelurahanCache.set(item.nama_kelurahan, k.kode_wilayah);
                }
            }
        }

        const createdItem = await prisma.m_perusahaan.upsert({
            where: { id: item.id },
            update: {
                m_sektor_industri_id: item.m_sektor_industri_id,
                m_skala_perusahaan_id: item.m_skala_perusahaan_id,
                kode_wilayah_induk_provinsi: kode_provinsi,
                kode_wilayah_induk_kota: kode_kota,
                kode_wilayah_induk_kecamatan: kode_kecamatan,
                kode_wilayah_induk_kelurahan: kode_kelurahan,
                nama: item.nama,
                nama_kontak: item.nama_kontak,
                jabatan_kontak: item.jabatan_kontak,
                no_handphone: item.no_handphone,
                email: item.email,
                website: item.website,
                instagram: item.instagram,
                linkedin: item.linkedin,
                whatsapp: item.whatsapp,
                alamat: item.alamat,
                sumber_informasi: item.sumber_informasi,
                catatan: item.catatan,
                logo_url: item.logo_url
            },
            create: {
                id: item.id,
                m_sektor_industri_id: item.m_sektor_industri_id,
                m_skala_perusahaan_id: item.m_skala_perusahaan_id,
                kode_wilayah_induk_provinsi: kode_provinsi,
                kode_wilayah_induk_kota: kode_kota,
                kode_wilayah_induk_kecamatan: kode_kecamatan,
                kode_wilayah_induk_kelurahan: kode_kelurahan,
                nama: item.nama,
                nama_kontak: item.nama_kontak,
                jabatan_kontak: item.jabatan_kontak,
                no_handphone: item.no_handphone,
                email: item.email,
                website: item.website,
                instagram: item.instagram,
                linkedin: item.linkedin,
                whatsapp: item.whatsapp,
                alamat: item.alamat,
                sumber_informasi: item.sumber_informasi,
                catatan: item.catatan,
                logo_url: item.logo_url
            }
        });
        await indexDocument(ELASTIC_INDICES.PERUSAHAAN, createdItem.id.toString(), createdItem);
    }

    // Update sequence to avoid conflicts on future inserts
    const maxPerusahaan = await prisma.m_perusahaan.aggregate({
        _max: { id: true },
    });
    const maxId = maxPerusahaan._max.id;
    if (maxId) {
        await prisma.$executeRawUnsafe(
            `SELECT setval('m_perusahaan_id_seq', coalesce((SELECT MAX(id) FROM m_perusahaan), 1), true);`
        );
    }
}
