import { z } from "zod";

export const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
});

export const hakAksesRuleSchema = z.object({
    m_level_id: z.number().int().positive().nullable(),
    m_jabatan_id: z.number().int().positive().nullable(),
});

export const createHakAksesSchema = z.object({
    nama_fitur: z.string().min(3),
    tipe_fitur: z.string().min(3),
    endpoint: z.string().min(1),
    method: z.string().min(3),
    is_all_level: z.boolean().default(false),
    is_all_jabatan: z.boolean().default(false),
    rules: z.array(hakAksesRuleSchema).optional(),
});

// Since the request asks for a bulk upload (5 step modal creating 4 features: Read, Create, Update, Delete)
export const bulkCreateHakAksesSchema = z.array(createHakAksesSchema);

export const updateHakAksesSchema = z.object({
    is_all_level: z.boolean().optional(),
    is_all_jabatan: z.boolean().optional(),
    rules: z.array(hakAksesRuleSchema).optional(),
});
