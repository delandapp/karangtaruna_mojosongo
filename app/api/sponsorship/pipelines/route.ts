import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { produceCacheInvalidate } from "@/lib/kafka";
import { eventSponsorSchema } from "@/lib/validations/sponsorship.schema";
import { z } from "zod";

// ─── Cache Keys ───────────────────────────────────────────────────────────────

const cacheKeyList = (eventId: number) =>
  `sponsorship:pipelines:event:${eventId}:*`;

// ─── Query Schema ─────────────────────────────────────────────────────────────

const listQuerySchema = z.object({
  event_id: z.coerce.number().int().positive(),
});

// ──────────────────────────────────────────────────────────
// GET /api/sponsorship/pipelines?event_id=1
// Ambil semua pipeline sponsor untuk event tertentu.
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const result = listQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!result.success) {
      return errorResponse(
        400,
        "Event ID wajib disertakan dan harus berupa angka",
        "VALIDATION_ERROR",
      );
    }

    const { event_id } = result.data;

    const data = await prisma.event_sponsor.findMany({
      where: { event_id },
      include: {
        sponsor: {
          include: { m_perusahaan: true, kategori: true },
        },
        ditangani_oleh: {
          select: { id: true, nama_lengkap: true },
        },
      },
      orderBy: { diperbarui_pada: "desc" },
    });

    return successResponse(data, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/sponsorship/pipelines
// Tambah sponsor ke event (Pipeline Prospect).
// Jika m_sponsor_id tidak diberikan, cari atau buat sponsor baru
// berdasarkan m_perusahaan_id atau m_brand_id.
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = eventSponsorSchema.parse(body);

    let sponsorId = validatedData.m_sponsor_id;

    if (!sponsorId) {
      if (!validatedData.m_perusahaan_id && !validatedData.m_brand_id) {
        return errorResponse(
          400,
          "Harus menyertakan m_perusahaan_id atau m_brand_id jika m_sponsor_id kosong",
          "VALIDATION_ERROR",
        );
      }

      // Cari atau buat sponsor berdasarkan perusahaan/brand
      const whereCondition = validatedData.m_brand_id
        ? { m_brand_id: validatedData.m_brand_id as number }
        : { m_perusahaan_id: validatedData.m_perusahaan_id as number };

      let sponsor = await prisma.m_sponsor.findFirst({
        where: whereCondition,
        select: { id: true },
      });

      if (!sponsor) {
        sponsor = await prisma.m_sponsor.create({
          data: {
            m_brand_id: validatedData.m_brand_id ?? undefined,
            m_perusahaan_id: validatedData.m_perusahaan_id ?? undefined,
            total_disponsori: 0,
          },
          select: { id: true },
        });
      }

      sponsorId = sponsor.id;
    }

    // Cek duplikasi di event ini
    const existingPipeline = await prisma.event_sponsor.findUnique({
      where: {
        event_id_m_sponsor_id: {
          event_id: validatedData.event_id,
          m_sponsor_id: sponsorId,
        },
      },
      select: { id: true },
    });

    if (existingPipeline) {
      return errorResponse(
        409,
        "Sponsor ini sudah dimasukkan ke pipeline event tersebut.",
        "CONFLICT",
      );
    }

    const newPipeline = await prisma.event_sponsor.create({
      data: {
        event_id: validatedData.event_id,
        m_sponsor_id: sponsorId,
        ditangani_oleh_id: validatedData.ditangani_oleh_id ?? null,
        tier: validatedData.tier,
        jenis_kontribusi: validatedData.jenis_kontribusi,
        status_pipeline: validatedData.status_pipeline,
        jumlah_disepakati: validatedData.jumlah_disepakati,
        jumlah_diterima: validatedData.jumlah_diterima,
        deskripsi_inkind: validatedData.deskripsi_inkind,
        benefit_disepakati: validatedData.benefit_disepakati ?? undefined,
        benefit_terealisasi: validatedData.benefit_terealisasi ?? undefined,
        url_mou: validatedData.url_mou,
      },
      include: {
        sponsor: { include: { m_perusahaan: true } },
      },
    });

    // Invalidate list cache untuk event ini
    await produceCacheInvalidate(cacheKeyList(validatedData.event_id));

    return successResponse(newPipeline, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
