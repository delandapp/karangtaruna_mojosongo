import { NextResponse } from "next/server";

export interface ApiResponseError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiResponseError;
  meta?: PaginationMeta;
}

// BigInt-safe replacer for NextResponse.json
function bigIntReplacer(_k: string, v: unknown) {
  return typeof v === "bigint" ? Number(v) : v;
}

/**
 * Creates a standardized 200 OK success response for a single item or simple data.
 */
export function successResponse<T>(data: T, status = 200) {
  return new Response(JSON.stringify({ success: true, data }, bigIntReplacer), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Creates a standardized 200 OK success response for paginated/array data.
 */
export function paginatedResponse<T>(
  data: T[],
  meta: PaginationMeta,
  status = 200,
) {
  return new Response(JSON.stringify({ success: true, data, meta }, bigIntReplacer), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Creates a standardized Error response (400, 401, 403, 404, 500, dll).
 */
export function errorResponse(
  status: number,
  message: string,
  code: string = "INTERNAL_SERVER_ERROR",
  details?: any,
) {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status },
  );
}
