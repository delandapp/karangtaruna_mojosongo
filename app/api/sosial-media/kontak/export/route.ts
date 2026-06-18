import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/error-handler";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { errorResponse } from "@/lib/api-response";

// GET /api/sosial-media/kontak/export?akun_id=...
// Returns a Google Contacts compatible CSV
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const akunIdParam = searchParams.get("akun_id");

    if (!akunIdParam) {
      return errorResponse(400, "akun_id wajib diisi", "VALIDATION_ERROR");
    }

    const akunId = Number(akunIdParam);
    if (isNaN(akunId)) {
      return errorResponse(400, "akun_id tidak valid", "VALIDATION_ERROR");
    }

    const contacts = await prisma.m_kontak_wa.findMany({
      where: {
        akun_id: akunId,
        dihapus_pada: null,
      },
      orderBy: { nama: "asc" },
    });

    // Google Contacts CSV standard headers
    const headers = [
      "Name",
      "Given Name",
      "Family Name",
      "Group Membership",
      "E-mail 1 - Type",
      "E-mail 1 - Value",
      "Phone 1 - Type",
      "Phone 1 - Value",
      "Organization 1 - Name",
      "Organization 1 - Title",
      "Notes",
    ];

    const escapeCSV = (value: string | null | undefined): string => {
      if (!value) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = contacts.map((c) => {
      const nameParts = c.nama.split(" ");
      const givenName = nameParts[0] || "";
      const familyName = nameParts.slice(1).join(" ") || "";

      return [
        escapeCSV(c.nama),
        escapeCSV(givenName),
        escapeCSV(familyName),
        escapeCSV(c.grup || "* myContacts"),
        c.email ? "* Other" : "",
        escapeCSV(c.email),
        "Mobile",
        escapeCSV(c.nomor_telp),
        escapeCSV(c.perusahaan),
        escapeCSV(c.jabatan),
        escapeCSV(c.catatan),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="kontak_whatsapp_${akunId}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
