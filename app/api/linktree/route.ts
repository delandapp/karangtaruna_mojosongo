import { prisma } from "@/lib/prisma";
import { successResponse, paginatedResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { schemaCreateLinktree } from "@/lib/validations/linktree.schema";

// ──────────────────────────────────────────────────────────
// GET /api/linktree — List Linktrees
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") || 10)));
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where: any = {
      dihapus_pada: null,
      dibuat_oleh_id: req.user.userId,
    };

    if (search) {
      where.OR = [
        { judul: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.m_linktree.findMany({
        where,
        include: {
          _count: {
            select: { links: { where: { dihapus_pada: null } } },
          },
        },
        orderBy: { dibuat_pada: "desc" },
        skip,
        take: limit,
      }),
      prisma.m_linktree.count({ where }),
    ]);

    // Map to include total links
    const mapped = data.map((item: any) => ({
      ...item,
      jumlah_link: item._count.links,
    }));

    return paginatedResponse(mapped, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// ──────────────────────────────────────────────────────────
// POST /api/linktree — Create Linktree
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const parsed = schemaCreateLinktree.safeParse(body);
    if (!parsed.success) {
      return errorResponse(400, parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const ltData = parsed.data;

    // Check slug uniqueness
    const slugExists = await prisma.m_linktree.findFirst({
      where: { slug: ltData.slug, dihapus_pada: null },
      select: { id: true },
    });

    if (slugExists) {
      return errorResponse(409, "Slug sudah digunakan, silakan pilih slug lain", "SLUG_CONFLICT");
    }

    const linktree = await prisma.m_linktree.create({
      data: {
        slug: ltData.slug,
        judul: ltData.judul,
        bio: ltData.bio || null,
        tema: ltData.tema,
        foto_profil_url: ltData.foto_profil_url || null,
        warna_primer: ltData.warna_primer || null,
        warna_latar: ltData.warna_latar || null,
        font_kustom: ltData.font_kustom || null,
        bg_image_url: ltData.bg_image_url || null,
        gaya_tombol: ltData.gaya_tombol || null,
        animasi_tombol: ltData.animasi_tombol || null,
        warna_tombol_latar: ltData.warna_tombol_latar || null,
        warna_tombol_teks: ltData.warna_tombol_teks || null,
        warna_tombol_border: ltData.warna_tombol_border || null,
        border_radius_tombol: ltData.border_radius_tombol || null,
        sosmed_instagram: ltData.sosmed_instagram || null,
        sosmed_tiktok: ltData.sosmed_tiktok || null,
        sosmed_whatsapp: ltData.sosmed_whatsapp || null,
        sosmed_facebook: ltData.sosmed_facebook || null,
        sosmed_youtube: ltData.sosmed_youtube || null,
        sosmed_github: ltData.sosmed_github || null,
        sosmed_email: ltData.sosmed_email || null,
        sosmed_telepon: ltData.sosmed_telepon || null,
        meta_judul: ltData.meta_judul || null,
        meta_deskripsi: ltData.meta_deskripsi || null,
        aktif: ltData.aktif,
        dibuat_oleh_id: req.user.userId,
      },
    });

    return successResponse(linktree, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
