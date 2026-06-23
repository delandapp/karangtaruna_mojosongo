import { prisma } from "@/lib/prisma";
import { successResponse, paginatedResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { schemaCreateShortlink, schemaFilterShortlink } from "@/lib/validations/shortlink.schema";
import { generateShortlinkSlug } from "@/lib/generator/shortlink-slug-generator";

// ──────────────────────────────────────────────────────────
// GET /api/shortlink — List Shortlinks (paginated)
// ──────────────────────────────────────────────────────────
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    const parsed = schemaFilterShortlink.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      is_aktif: searchParams.get("is_aktif") ?? undefined,
    });

    if (!parsed.success) {
      return errorResponse(400, parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const { page, limit, search, is_aktif } = parsed.data;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      dihapus_pada: null,
    };

    if (is_aktif !== undefined) {
      where.is_aktif = is_aktif;
    }

    if (search) {
      where.OR = [
        { judul: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { url_tujuan: { contains: search, mode: "insensitive" } },
        { deskripsi: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.m_shortlink.findMany({
        where,
        include: {
          dibuat_oleh: {
            select: { id: true, nama_lengkap: true },
          },
        },
        orderBy: { dibuat_pada: "desc" },
        skip,
        take: limit,
      }),
      prisma.m_shortlink.count({ where }),
    ]);

    // Map to response format (rename nama_lengkap -> nama)
    const mappedData = data.map((item) => ({
      ...item,
      dibuat_oleh: item.dibuat_oleh
        ? { id: item.dibuat_oleh.id, nama: item.dibuat_oleh.nama_lengkap }
        : null,
    }));

    return paginatedResponse(mappedData, {
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
// POST /api/shortlink — Create Shortlink
// ──────────────────────────────────────────────────────────
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();

    const parsed = schemaCreateShortlink.safeParse(body);
    if (!parsed.success) {
      return errorResponse(400, parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const { judul, url_tujuan, slug, deskripsi, is_aktif, kedaluwarsa_pada } = parsed.data;

    // Generate or validate slug
    let finalSlug: string;
    if (slug && slug.trim() !== "") {
      // Check if slug already exists
      const existing = await prisma.m_shortlink.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (existing) {
        return errorResponse(409, "Slug sudah digunakan, silakan pilih slug lain", "SLUG_CONFLICT");
      }
      finalSlug = slug;
    } else {
      finalSlug = await generateShortlinkSlug();
    }

    const shortlink = await prisma.m_shortlink.create({
      data: {
        judul,
        slug: finalSlug,
        url_tujuan,
        deskripsi: deskripsi || null,
        is_aktif: is_aktif ?? true,
        kedaluwarsa_pada: kedaluwarsa_pada ? new Date(kedaluwarsa_pada) : null,
        dibuat_oleh_id: req.user.userId,
      },
      include: {
        dibuat_oleh: {
          select: { id: true, nama_lengkap: true },
        },
      },
    });

    const mapped = {
      ...shortlink,
      dibuat_oleh: shortlink.dibuat_oleh
        ? { id: shortlink.dibuat_oleh.id, nama: shortlink.dibuat_oleh.nama_lengkap }
        : null,
    };

    return successResponse(mapped, 201);
  } catch (error) {
    return handleApiError(error);
  }
});
