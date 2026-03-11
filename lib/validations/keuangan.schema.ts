import { z } from "zod";

export const createItemAnggaranSchema = z.object({
  jenis_item: z.enum(["pemasukan", "pengeluaran"]),
  kategori: z.string().min(1, "Kategori wajib diisi"),
  kode_item: z.string().optional().nullable(),
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
  jumlah_satuan: z.number().int().min(1, "Minimal jumlah satuan adalah 1").default(1),
  harga_satuan_rencana: z.number().min(0, "Harga satuan tidak boleh negatif").default(0),
  catatan: z.string().optional().nullable(),
});

export const updateItemAnggaranSchema = z.object({
  jenis_item: z.enum(["pemasukan", "pengeluaran"]).optional(),
  kategori: z.string().min(1).optional(),
  kode_item: z.string().optional().nullable(),
  deskripsi: z.string().min(1).optional(),
  jumlah_satuan: z.number().int().min(1).optional(),
  harga_satuan_rencana: z.number().min(0).optional(),
  catatan: z.string().optional().nullable(),
});

export const createTransaksiKeuanganSchema = z.object({
  anggaran_id: z.number().int("Event ID tidak valid"),
  item_anggaran_id: z.number().int().optional().nullable(),
  // nomor_transaksi is likely auto-generated in the backend, not part of payload
  jenis_transaksi: z.enum(["pemasukan", "pengeluaran"]),
  jumlah: z.number().min(0, "Jumlah tidak boleh negatif"),
  deskripsi: z.string().min(1, "Deskripsi transaksi wajib diisi"),
  bukti_url: z.string().url("URL bukti tidak valid").optional().nullable(),
  tanggal_transaksi: z.string().datetime({ message: "Format tanggal tidak valid (ISO 8601)" }),
  catatan: z.string().optional().nullable(),
  // status is defaults to 'menunggu_persetujuan'
});

export const updateTransaksiKeuanganSchema = z.object({
  item_anggaran_id: z.number().int().optional().nullable(),
  jenis_transaksi: z.enum(["pemasukan", "pengeluaran"]).optional(),
  jumlah: z.number().min(0).optional(),
  deskripsi: z.string().min(1).optional(),
  bukti_url: z.string().url().optional().nullable(),
  tanggal_transaksi: z.string().datetime().optional(),
  status: z.enum(["menunggu_persetujuan", "disetujui", "ditolak", "dibayar"]).optional(),
  catatan: z.string().optional().nullable(),
});
