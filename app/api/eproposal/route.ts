import { indexDocument, deleteDocument } from "@/lib/elasticsearch";
import { invalidateCachePrefix } from "@/lib/redis";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";

import { REDIS_KEYS } from "@/lib/constants";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Ekstrak URL string dari field yang mungkin berupa object atau string */
function extractUrl(value: unknown): string {
  let url = "";
  if (typeof value === "string") {
    url = value;
  } else if (value && typeof value === "object") {
    const obj = value as Record<string, any>;
    url = obj.file?.urlPublik || obj.url || "";
  }
  return url.replace("http://shared-minio:9000", "https://storage.mediatamaedu.com");
}

/** Validasi ekstensi file berdasarkan whitelist */
function validateExtension(url: string, allowed: string[]): boolean {
  if (!url) return true;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  return allowed.includes(ext);
}

// ──────────────────────────────────────────────────────────
// POST /api/eproposal — Buat E-Proposal Baru
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { userId } = req.user;
    const body = await req.json();

    const { event_id, judul, slug, deskripsi, pengaturan, daftar_isi } = body;

    // Normalisasi URL fields yang mungkin dikirim sebagai object
    const file_pdf_url = extractUrl(body.file_pdf_url);
    const cover_url = extractUrl(body.cover_url);
    const bg_music_url = extractUrl(pengaturan?.bg_music_url);

    // Validasi format cover (hanya JPEG/PNG)
    if (!validateExtension(cover_url, ["jpg", "jpeg", "png"])) {
      return errorResponse(
        400,
        "Format cover tidak valid. Hanya file JPEG dan PNG yang diizinkan.",
        "VALIDATION_ERROR",
      );
    }

    // Validasi format musik latar (hanya MP3)
    if (!validateExtension(bg_music_url, ["mp3"])) {
      return errorResponse(
        400,
        "Format musik tidak valid. Hanya file MP3 yang diizinkan.",
        "VALIDATION_ERROR",
      );
    }

    const newProposal = await prisma.m_eproposal.create({
      data: {
        event_id,
        dibuat_oleh_id: userId,
        judul,
        slug,
        deskripsi,
        file_pdf_url,
        cover_url,
        pengaturan: pengaturan
          ? {
              create: {
                auto_flip: pengaturan.auto_flip,
                sound_effect: pengaturan.sound_effect,
                bg_music_url: bg_music_url || null,
                theme_color: pengaturan.theme_color,
                animasi_transisi: pengaturan.animasi_transisi,
              },
            }
          : undefined,
        daftar_isi:
          Array.isArray(daftar_isi) && daftar_isi.length > 0
            ? {
                createMany: {
                  data: daftar_isi.map((d: any, i: number) => ({
                    judul: d.judul,
                    halaman: d.halaman,
                    urutan: d.urutan ?? i + 1,
                  })),
                },
              }
            : undefined,
      },
      include: {
        pengaturan: true,
        daftar_isi: { orderBy: { urutan: "asc" } },
      },
    });

    // Invalidate cache
    await invalidateCachePrefix(REDIS_KEYS.E_PROPOSAL.ALL_PREFIX(event_id));

    return successResponse(newProposal, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
