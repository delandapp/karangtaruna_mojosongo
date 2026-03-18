import { NextRequest } from "next/server";
import { Resend } from "resend";
import { successResponse, errorResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/error-handler";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key");

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, attachments } = await request.json();

    if (!to || !subject) {
      return errorResponse(400, "Missing 'to' or 'subject' field", "BAD_REQUEST");
    }

    const data = await resend.emails.send({
      from: "Sponsorship Team <sponsorship@karangtarunamojosongo.org>",
      to,
      subject,
      html: html || "<p>Terlampir adalah dokumen proposal sponsorship kami.</p>",
      attachments: attachments || [],
    });

    return successResponse(data, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
