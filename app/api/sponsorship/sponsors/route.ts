import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";
import { sponsorSchema } from "@/lib/validations/sponsorship.schema";

/**
 * GET: Ambil daftar sponsor dengan pagination & search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const m_kategori_sponsor_id = searchParams.get("m_kategori_sponsor_id");

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.m_perusahaan = {
        nama: { contains: search, mode: "insensitive" },
      };
    }
    if (m_kategori_sponsor_id) {
      where.m_kategori_sponsor_id = parseInt(m_kategori_sponsor_id);
    }

    const [total, data] = await Promise.all([
      prisma.m_sponsor.count({ where }),
      prisma.m_sponsor.findMany({
        where,
        include: {
          m_perusahaan: true,
          kategori: true,
        },
        skip,
        take: limit,
        orderBy: { diperbarui_pada: "desc" },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return new Response(
      JSON.stringify(
        {
          success: true,
          data,
          meta: { page, limit, total, totalPages },
        },
        (_, v) => (typeof v === "bigint" ? Number(v) : v)
      ),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST: Tambah Master Sponsor baru
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const validatedData = sponsorSchema.parse(json);

    // Cek duplikasi berdasarkan m_perusahaan_id
    if (validatedData.m_perusahaan_id) {
      const existingSponsor = await prisma.m_sponsor.findUnique({
        where: { m_perusahaan_id: validatedData.m_perusahaan_id },
      });
      if (existingSponsor) {
        return errorResponse(400, "Perusahaan ini sudah terdaftar sebagai sponsor.", "DUPLICATE_SPONSOR");
      }
    }

    // Cek duplikasi berdasarkan m_brand_id
    if (validatedData.m_brand_id) {
      const existingSponsor = await prisma.m_sponsor.findUnique({
        where: { m_brand_id: validatedData.m_brand_id },
      });
      if (existingSponsor) {
        return errorResponse(400, "Brand ini sudah terdaftar sebagai sponsor.", "DUPLICATE_SPONSOR");
      }
    }

    const newSponsor = await prisma.m_sponsor.create({
      data: {
        m_perusahaan_id: validatedData.m_perusahaan_id || undefined,
        m_brand_id: validatedData.m_brand_id || undefined,
        m_kategori_sponsor_id: validatedData.m_kategori_sponsor_id || null,
        total_disponsori: validatedData.total_disponsori || 0,
      },
      include: {
        m_perusahaan: true,
        m_brand: true,
        kategori: true,
      },
    });

    return successResponse(newSponsor, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
