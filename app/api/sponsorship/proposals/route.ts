import { prisma } from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { getCache, setCache } from "@/lib/redis";
import { DEFAULT_CACHE_TTL } from "@/lib/constants";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { produceCacheInvalidate } from "@/lib/kafka";
import { proposalSponsorSchema } from "@/lib/validations/sponsorship.schema";
import { z } from "zod";

// ─── Cache Keys ───────────────────────────────────────────────────────────────

const cacheKeyList = (eventId?: number) =>
  `sponsorship:proposal:all:event:${eventId ?? "all"}`;
const CACHE_INVALIDATE_PREFIX = "sponsorship:proposal:all:*";

// ─── Query Schema ─────────────────────────────────────────────────────────────

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  event_id: z.coerce.number().int().positive().optional(),
});

// ──────────────────────────────────────────────────────────
// GET /api/sponsorship/proposals — List Proposal Sponsorship
// Filter opsional: ?event_id=1
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, event_id } = listQuerySchema.parse(
      Object.fromEntries(searchParams),
    );

    const skip = (page - 1) * limit;

    // Cek cache — dipisahkan per event_id agar akurat
    const cacheKey = cacheKeyList(event_id);
    const cached = await getCache<{ data: unknown[]; meta: unknown }>(cacheKey);
    if (cached)
      return paginatedResponse(cached.data as any[], cached.meta as any, 200);

    // Build Prisma where clause
    const where: Record<string, unknown> = {};
    if (event_id) where.event_id = event_id;

    const [total, data] = await prisma.$transaction([
      prisma.proposal_sponsor.count({ where }),
      prisma.proposal_sponsor.findMany({
        where,
        include: {
          sponsor: { include: { m_perusahaan: true } },
          dikirim_oleh: { select: { id: true, nama_lengkap: true } },
        },
        skip,
        take: limit,
        orderBy: { dibuat_pada: "desc" },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const meta = { page, limit, total, totalPages };

    // Simpan ke cache
    await setCache(cacheKey, { data, meta }, DEFAULT_CACHE_TTL);

    return paginatedResponse(data, meta, 200);
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/sponsorship/proposals — Kirim Proposal Sponsorship
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const validatedData = proposalSponsorSchema.parse(body);

    // Verifikasi event ada
    const eventExists = await prisma.event.findUnique({
      where: { id: validatedData.event_id },
      select: { id: true, status_event: true },
    });
    if (!eventExists) {
      return errorResponse(404, "Event tidak ditemukan", "NOT_FOUND");
    }

    // Cegah pengiriman ke event yang sudah selesai/dibatalkan
    if (
      eventExists.status_event === "selesai" ||
      eventExists.status_event === "dibatalkan"
    ) {
      return errorResponse(
        422,
        `Tidak dapat mengirim proposal ke event dengan status "${eventExists.status_event}"`,
        "UNPROCESSABLE_ENTITY",
      );
    }

    // Verifikasi sponsor ada
    const sponsorExists = await prisma.m_sponsor.findUnique({
      where: { id: validatedData.m_sponsor_id },
      select: { id: true },
    });
    if (!sponsorExists) {
      return errorResponse(404, "Sponsor tidak ditemukan", "NOT_FOUND");
    }

    const newProposal = await prisma.proposal_sponsor.create({
      data: {
        event_id: validatedData.event_id,
        m_sponsor_id: validatedData.m_sponsor_id,
        dikirim_oleh_id: validatedData.dikirim_oleh_id,
        tier_diusulkan: validatedData.tier_diusulkan,
        respons: validatedData.respons || "menunggu",
        url_file_proposal: validatedData.url_file_proposal,
        catatan: validatedData.catatan,
        dikirim_pada: new Date(),
      },
      include: {
        sponsor: { include: { m_perusahaan: true } },
        dikirim_oleh: { select: { id: true, nama_lengkap: true } },
      },
    });

    // Invalidate list cache — CDC akan sync ke ES secara otomatis
    await produceCacheInvalidate(CACHE_INVALIDATE_PREFIX);

    return successResponse(newProposal, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
