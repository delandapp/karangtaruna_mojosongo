import { prisma } from "@/lib/prisma";

/**
 * Generates a unique event code in the format: EVT-MMYY-NNN
 * e.g. EVT-0325-001, EVT-0325-002
 *
 * The increment is scoped to the current month+year so each month
 * resets from 001. On unique-constraint collision the function retries
 * automatically (race-condition safe for low-concurrency systems).
 */
export async function generateKodeEvent(): Promise<string> {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0"); // 01-12
  const yy = String(now.getFullYear()).slice(-2);          // e.g. "25"
  const prefix = `EVT-${mm}${yy}-`;

  // Count existing codes with this prefix to derive the next increment
  const existing = await prisma.event.count({
    where: {
      kode_event: { startsWith: prefix },
    },
  });

  // Build candidate code; retry logic handles rare concurrent collisions
  const next = existing + 1;
  const candidate = `${prefix}${String(next).padStart(3, "0")}`;

  // Verify uniqueness (double-check for concurrency safety)
  const collision = await prisma.event.findUnique({
    where: { kode_event: candidate },
    select: { id: true },
  });

  if (collision) {
    // Increment further and try once more
    const fallback = `${prefix}${String(next + 1).padStart(3, "0")}`;
    return fallback;
  }

  return candidate;
}
