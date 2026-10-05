import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".avif",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".mp3",
  ".wav",
  ".ogg",
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const formData = await req.formData();
    const file = formData.get("file");

    const rawBucketName =
      (formData.get("bucket") as string) ||
      (formData.get("bucketName") as string) ||
      searchParams.get("bucket") ||
      searchParams.get("bucketName") ||
      "general";

    const bucketName = rawBucketName
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase();

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "File tidak ditemukan dalam request" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Ukuran file melebihi batas maksimum 25MB",
        },
        { status: 400 },
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) && !ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: `Format file ${ext || file.type} tidak didukung`,
        },
        { status: 400 },
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", bucketName);
    await fs.promises.mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(4).toString("hex");
    const rawBaseName = path.basename(file.name, ext);
    const safeBaseName = rawBaseName
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 50);
    const finalFileName = `${timestamp}-${randomHex}-${safeBaseName}${ext}`;

    const filePath = path.join(uploadsDir, finalFileName);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(filePath, fileBuffer);

    const publicUrl = `/uploads/${bucketName}/${finalFileName}`;

    const responseData = {
      url: publicUrl,
      urlPublik: publicUrl,
      fileUrl: publicUrl,
      s3_url: publicUrl,
      s3_key: `${bucketName}/${finalFileName}`,
      Location: publicUrl,
      fileName: finalFileName,
      originalName: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      file: {
        url: publicUrl,
        urlPublik: publicUrl,
        fileName: finalFileName,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
      },
    };

    return NextResponse.json(
      {
        success: true,
        message: "File berhasil diunggah",
        data: responseData,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[STORAGE_UPLOAD_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Terjadi kesalahan saat mengunggah file",
      },
      { status: 500 },
    );
  }
}
