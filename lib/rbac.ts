import { prisma } from "@/lib/prisma";
import { getCache, setCache } from "@/lib/redis";
import { REDIS_KEYS, DEFAULT_CACHE_TTL } from "@/lib/constants";

/**
 * Checks if a user has access to a specific feature based on their level and jabatan
 * @param {number | null} levelId
 * @param {number | null} jabatanId
 * @param {string} endpoint
 * @param {string} method
 * @returns {Promise<boolean>}
 */
export async function checkUserAccess(
    levelId: number | null | undefined,
    jabatanId: number | null | undefined,
    endpoint: string,
    method: string
): Promise<boolean> {
    // Safe checks if user somehow has no level or jabatan at all and it's required
    const safeLevelId = levelId ?? 0;
    const safeJabatanId = jabatanId ?? 0;

    // Caching key combination of endpoint, method, level and jabatan
    const cacheKey = `rbac:access:${endpoint}:${method}:lvl:${safeLevelId}:jab:${safeJabatanId}`;

    const cachedAccess = await getCache<boolean>(cacheKey);
    if (cachedAccess !== null) {
        return cachedAccess;
    }

    // Find the exact feature rule
    const hakAkses = await prisma.m_hak_akses.findFirst({
        where: {
            endpoint: endpoint,
            method: method,
        },
        include: {
            rules: true,
        },
    });

    // If the feature isn't registered in the DB, default to deny (secure by default)
    // or you could default to true if you are slowly migrating. We'll default to false.
    if (!hakAkses) {
        console.warn(`RBAC Warning: Endpoint ${endpoint} [${method}] is not registered in m_hak_akses`);
        return false;
    }

    // If the feature allows everyone
    if (hakAkses.is_all_level && hakAkses.is_all_jabatan) {
        await setCache(cacheKey, true, DEFAULT_CACHE_TTL);
        return true;
    }

    // Check the dynamic rules
    let hasAccess = false;

    for (const rule of hakAkses.rules) {
        // Condition 1: Rule specifies BOTH Level and Jabatan (AND condition)
        if (rule.m_level_id !== null && rule.m_jabatan_id !== null) {
            if (rule.m_level_id === levelId && rule.m_jabatan_id === jabatanId) {
                hasAccess = true;
                break;
            }
        }
        // Condition 2: Rule specifies ONLY Level (Any Jabatan)
        else if (rule.m_level_id !== null && rule.m_jabatan_id === null) {
            if (rule.m_level_id === levelId) {
                hasAccess = true;
                break;
            }
        }
        // Condition 3: Rule specifies ONLY Jabatan (Any Level)
        else if (rule.m_level_id === null && rule.m_jabatan_id !== null) {
            if (rule.m_jabatan_id === jabatanId) {
                hasAccess = true;
                break;
            }
        }
    }

    await setCache(cacheKey, hasAccess, DEFAULT_CACHE_TTL);
    return hasAccess;
}
