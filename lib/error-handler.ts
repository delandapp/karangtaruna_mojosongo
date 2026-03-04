import { z } from "zod";
import { errorResponse } from "./api-response";
import { Prisma } from "@prisma/client";

/**
 * Helper to catch and format API errors globally
 */
export function handleApiError(error: unknown) {
  console.error("[API_ERROR]", error);

  // 1. Zod Validation Errors (400 Bad Request)
  if (error instanceof z.ZodError) {
    const formattedErrors = error.issues.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));

    return errorResponse(
      400,
      "Validasi data gagal",
      "VALIDATION_ERROR",
      formattedErrors,
    );
  }

  // 2. Prisma Database Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: Unique constraint failed
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[]) || ["field"];
      return errorResponse(
        409,
        `Data sudah digunakan: ${target.join(", ")}`,
        "UNIQUE_CONSTRAINT_FAILED",
        { conflicts: target },
      );
    }

    // P2025: Record not found
    if (error.code === "P2025") {
      return errorResponse(404, "Data tidak ditemukan", "NOT_FOUND");
    }

    return errorResponse(400, "Database error", "DATABASE_ERROR", {
      code: error.code,
    });
  }

  // 3. Custom Error / Generic Error
  if (error instanceof Error) {
    // Tangani error malformed JSON (misal request tanpa body atau body JSON terpotong)
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return errorResponse(
        400,
        "Format JSON tidak valid atau request body kosong.",
        "BAD_REQUEST",
      );
    }

    // Check if it's our own thrown error format (e.g. from service layer)
    if (error.message.includes("UNAUTHORIZED")) {
      return errorResponse(401, "Akses ditolak", "UNAUTHORIZED");
    }

    return errorResponse(500, error.message, "INTERNAL_SERVER_ERROR");
  }

  // Fallback
  return errorResponse(500, "Terjadi kesalahan pada server", "UNKNOWN_ERROR");
}
