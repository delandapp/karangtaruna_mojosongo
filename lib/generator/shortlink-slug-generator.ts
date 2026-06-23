import { prisma } from "@/lib/prisma";

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const DEFAULT_LENGTH = 6;

/**
 * Generate a unique random slug for shortlinks.
 * Checks against the database to ensure uniqueness.
 *
 * @param length - Length of the slug (default: 6)
 * @param maxAttempts - Maximum number of attempts to find a unique slug (default: 10)
 * @returns A unique slug string
 */
export async function generateShortlinkSlug(
  length: number = DEFAULT_LENGTH,
  maxAttempts: number = 10
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let slug = "";
    for (let i = 0; i < length; i++) {
      slug += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }

    // Check if slug already exists
    const existing = await prisma.m_shortlink.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }
  }

  // Fallback: use timestamp-based slug
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `${timestamp}-${random}`;
}
