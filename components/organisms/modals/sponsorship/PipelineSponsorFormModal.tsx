"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePipelineMutation, useUpdatePipelineMutation } from "@/lib/redux/slices/sponsorship/pipelineApi";
import { useGetBrandsQuery } from "@/features/api/brandApi";
import { useGetPerusahaanListQuery } from "@/features/api/perusahaanApi";
import { ComboBox } from "@/components/ui/combobox";
import { toast } from "sonner";
import { Loader2, Building, Tag, ArrowLeft } from "lucide-react";

// ── Schema ────────────────────────────────────────────────────────────────────
const formSchema = z
  .object({
    m_brand_id: z.coerce.number().optional().nullable(),
    m_perusahaan_id: z.coerce.number().optional().nullable(),
    sponsor_id: z.coerce.number().optional().nullable(),
    status_pipeline: z.string().min(1, "Status pipeline harus dipilih"),
    tier: z.string().min(1, "Tier harus dipilih"),
    jenis_kontribusi: z.string().min(1, "Jenis kontribusi harus dipilih"),
    jumlah_disepakati: z.coerce.number().optional(),
    jumlah_diterima: z.coerce.number().optional(),
    keterangan: z.string().optional(),
  })
  .refine((data) => data.m_perusahaan_id || data.m_brand_id || data.sponsor_id, {
    message: "Sponsor harus dipilih",
    path: ["m_brand_id"],
  });

type FormValues = z.infer<typeof formSchema>;

interface PipelineSponsorFormModalProps {
  eventId: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  onSuccess?: () => void;
}

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const PERUSAHAAN_LIMIT = 20;

// ═════════════════════════════════════════════════════════════════════════════
export function PipelineSponsorFormModal({
  eventId,
  isOpen,
  onOpenChange,
  initialData,
  onSuccess,
}: PipelineSponsorFormModalProps) {
  const [createPipeline, { isLoading: isCreating }] = useCreatePipelineMutation();
  const [updatePipeline, { isLoading: isUpdating }] = useUpdatePipelineMutation();

  // ── UI state ─────────────────────────────────────────────────────────────
  const [sponsorType, setSponsorType] = useState<"brand" | "perusahaan" | null>(null);
  const isEditing = !!initialData;
  const isLoading = isCreating || isUpdating;

  // ── Brand state & query ──────────────────────────────────────────────────
  const [brandSearch, setBrandSearch] = useState("");
  const debouncedBrandSearch = useDebouncedValue(brandSearch, 350);

  // Brand API returns paginatedResponse: { data: [...], meta: {...} }
  const { data: brandsRaw, isLoading: loadBrands } = useGetBrandsQuery({
    page: 1,
    limit: 100,
    search: debouncedBrandSearch || undefined,
  } as any);

  const brands: any[] = useMemo(() => {
    if (!brandsRaw) return [];
    const r = brandsRaw as any;
    // Both paginatedResponse and successResponse store items in `.data`
    return Array.isArray(r.data) ? r.data : [];
  }, [brandsRaw]);

  // ── Perusahaan state & query ─────────────────────────────────────────────
  const [perusahaanPage, setPerusahaanPage] = useState(1);
  const [perusahaanSearch, setPerusahaanSearch] = useState("");
  const [perusahaanAccumulated, setPerusahaanAccumulated] = useState<any[]>([]);
  const [isLoadingMorePerusahaan, setIsLoadingMorePerusahaan] = useState(false);
  const debouncedPerusahaanSearch = useDebouncedValue(perusahaanSearch, 350);

  const {
    data: perusahaanResponse,
    isLoading: loadPerusahaan,
    isFetching: fetchingPerusahaan,
  } = useGetPerusahaanListQuery({
    page: perusahaanPage,
    limit: PERUSAHAAN_LIMIT,
    search: debouncedPerusahaanSearch || undefined,
  });

  // Accumulate pages — handles both data arrival and search reset
  const prevSearchRef = useRef(debouncedPerusahaanSearch);
  const isInitialMount = useRef(true);

  // When search changes, reset page to 1 (but don't clear data on mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Actual search changed — reset pagination
    setPerusahaanPage(1);
    setPerusahaanAccumulated([]);
  }, [debouncedPerusahaanSearch]);

  // Sync API data into accumulated list
  useEffect(() => {
    if (!perusahaanResponse?.data) return;
    const searchChanged = prevSearchRef.current !== debouncedPerusahaanSearch;
    prevSearchRef.current = debouncedPerusahaanSearch;

    if (perusahaanPage === 1 || searchChanged) {
      setPerusahaanAccumulated(perusahaanResponse.data);
    } else {
      setPerusahaanAccumulated((prev) => {
        const ids = new Set(prev.map((p: any) => p.id));
        const newItems = perusahaanResponse.data.filter((p: any) => !ids.has(p.id));
        return [...prev, ...newItems];
      });
    }
    setIsLoadingMorePerusahaan(false);
  }, [perusahaanResponse, debouncedPerusahaanSearch, perusahaanPage]);

  const perusahaanPagination = useMemo(
    () =>
      perusahaanResponse?.meta
        ? {
            currentPage: perusahaanResponse.meta.page,
            totalPages: perusahaanResponse.meta.totalPages,
          }
        : undefined,
    [perusahaanResponse?.meta]
  );

  // Stable loadMore — useCallback prevents stale scroll closure
  const handleLoadMorePerusahaan = useCallback(
    (nextPage: number) => {
      if (!fetchingPerusahaan && !isLoadingMorePerusahaan) {
        setIsLoadingMorePerusahaan(true);
        setPerusahaanPage(nextPage);
      }
    },
    [fetchingPerusahaan, isLoadingMorePerusahaan]
  );

  const handlePerusahaanSearch = useCallback((q: string) => setPerusahaanSearch(q), []);
  const handleBrandSearch = useCallback((q: string) => setBrandSearch(q), []);

  // ── Form ─────────────────────────────────────────────────────────────────
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      m_brand_id: null,
      m_perusahaan_id: null,
      sponsor_id: null,
      status_pipeline: "prospek",
      tier: "bronze",
      jenis_kontribusi: "uang",
      jumlah_disepakati: 0,
      jumlah_diterima: 0,
      keterangan: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    // Reset combobox state
    setPerusahaanPage(1);
    setPerusahaanSearch("");
    setBrandSearch("");
    setPerusahaanAccumulated([]);
    setSponsorType(null);

    if (initialData) {
      form.reset({
        m_brand_id: initialData.sponsor?.m_brand_id || null,
        m_perusahaan_id: initialData.sponsor?.m_perusahaan_id || null,
        sponsor_id: initialData.m_sponsor_id,
        status_pipeline: initialData.status_pipeline,
        tier: initialData.tier,
        jenis_kontribusi: initialData.jenis_kontribusi || "uang",
        jumlah_disepakati: Number(initialData.jumlah_disepakati) || 0,
        jumlah_diterima: Number(initialData.jumlah_diterima) || 0,
        keterangan: initialData.keterangan || "",
      });
    } else {
      form.reset({
        m_brand_id: null,
        m_perusahaan_id: null,
        sponsor_id: null,
        status_pipeline: "prospek",
        tier: "bronze",
        jenis_kontribusi: "uang",
        jumlah_disepakati: 0,
        jumlah_diterima: 0,
        keterangan: "",
      });
    }
  }, [isOpen, initialData, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = { ...values, event_id: eventId };
      if (isEditing) {
        await updatePipeline({ id: initialData.id, ...payload }).unwrap();
        toast.success("Pipeline sponsor berhasil diperbarui");
      } else {
        await createPipeline(payload).unwrap();
        toast.success("Pipeline sponsor berhasil ditambahkan");
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.data?.message || "Terjadi kesalahan");
    }
  };

  // Selected items for ComboBox (must pass full object)
  const watchedBrandId = form.watch("m_brand_id");
  const watchedPerusahaanId = form.watch("m_perusahaan_id");

  const selectedBrandItem = useMemo(
    () => brands.find((b: any) => b.id === watchedBrandId) ?? null,
    [watchedBrandId, brands]
  );
  const selectedPerusahaanItem = useMemo(
    () => perusahaanAccumulated.find((p: any) => p.id === watchedPerusahaanId) ?? null,
    [watchedPerusahaanId, perusahaanAccumulated]
  );

  const showTwoStepSelection = !isEditing && sponsorType === null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Pipeline Sponsor" : "Tambah Prospek Sponsor"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Perbarui detail status progres sponsorship."
              : "Masukkan prospek sponsor baru untuk event ini."}
          </DialogDescription>
        </DialogHeader>

        {/* ── STEP 1: choose type ── */}
        {showTwoStepSelection ? (
          <div className="flex flex-col gap-6 py-4">
            <div className="text-center font-medium text-sm text-muted-foreground pb-2 border-b">
              Pilih Tipe Target Sponsor
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-32 flex flex-col items-center justify-center gap-3 hover:bg-primary/5 hover:border-primary/50 transition-all group"
                onClick={() => setSponsorType("brand")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                  <Tag className="w-6 h-6 text-primary" />
                </div>
                <div className="font-semibold text-base">Pilih Brand</div>
              </Button>
              <Button
                variant="outline"
                className="h-32 flex flex-col items-center justify-center gap-3 hover:bg-primary/5 hover:border-primary/50 transition-all group"
                onClick={() => setSponsorType("perusahaan")}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                  <Building className="w-6 h-6 text-primary" />
                </div>
                <div className="font-semibold text-base">Perusahaan</div>
              </Button>
            </div>
          </div>
        ) : (
          /* ── STEP 2: form ── */
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Back button (create mode only) */}
              {!isEditing && (
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSponsorType(null)}
                    className="h-8 w-8 shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-muted-foreground">
                    Mode: {sponsorType === "brand" ? "Brand" : "Perusahaan"}
                  </span>
                </div>
              )}

              {/* ── Sponsor selector ── */}
              {!isEditing ? (
                sponsorType === "brand" ? (
                  <FormField
                    control={form.control}
                    name="m_brand_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pilih Brand</FormLabel>
                        <FormControl>
                          <ComboBox
                            data={brands}
                            labelKey="nama_brand"
                            valueKey="id"
                            title="Brand"
                            isModal={true}
                            selected={selectedBrandItem}
                            handleSearchData={handleBrandSearch}
                            onChange={(item: any) => {
                              field.onChange(item && typeof item === "object" ? item.id : null);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="m_perusahaan_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pilih Perusahaan</FormLabel>
                        <FormControl>
                          <ComboBox
                            data={perusahaanAccumulated}
                            labelKey="nama"
                            valueKey="id"
                            title="Perusahaan"
                            isModal={true}
                            selected={selectedPerusahaanItem}
                            handleSearchData={handlePerusahaanSearch}
                            useInfiniteScroll={true}
                            pagination={perusahaanPagination}
                            loadMore={handleLoadMorePerusahaan}
                            isLoadingMore={isLoadingMorePerusahaan}
                            onChange={(item: any) => {
                              field.onChange(item && typeof item === "object" ? item.id : null);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )
              ) : (
                <div className="px-4 py-3 bg-muted rounded-md border text-sm">
                  <span className="text-muted-foreground block text-xs font-semibold mb-1">
                    Editing Sponsor:
                  </span>
                  <span className="font-medium">
                    {initialData?.sponsor?.m_perusahaan?.nama ||
                      initialData?.sponsor?.m_brand?.nama_brand ||
                      "—"}
                  </span>
                </div>
              )}

              {/* ── Status + Tier ── */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status_pipeline"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Status Pipeline</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="prospek">Prospek</SelectItem>
                          <SelectItem value="dihubungi">Dihubungi</SelectItem>
                          <SelectItem value="negosiasi">Negosiasi</SelectItem>
                          <SelectItem value="dikonfirmasi">Dikonfirmasi</SelectItem>
                          <SelectItem value="lunas">Lunas</SelectItem>
                          <SelectItem value="selesai">Selesai</SelectItem>
                          <SelectItem value="batal">Batal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tier"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Tier Sponsorship</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih Tier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="platinum">Platinum</SelectItem>
                          <SelectItem value="gold">Gold</SelectItem>
                          <SelectItem value="silver">Silver</SelectItem>
                          <SelectItem value="bronze">Bronze</SelectItem>
                          <SelectItem value="inkind">In-Kind</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ── Jenis Kontribusi ── */}
              <FormField
                control={form.control}
                name="jenis_kontribusi"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Jenis Kontribusi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue="uang">
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih Jenis Kontribusi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="uang">💰 Dana / Uang</SelectItem>
                        <SelectItem value="barang">📦 Barang / In-Kind</SelectItem>
                        <SelectItem value="jasa">🛠️ Jasa</SelectItem>
                        <SelectItem value="campuran">🔀 Campuran</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Jumlah ── */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="jumlah_disepakati"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah Disepakati (Rp)</FormLabel>
                      <FormControl>
                        <Input type="number" className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jumlah_diterima"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jumlah Diterima (Rp)</FormLabel>
                      <FormControl>
                        <Input type="number" className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ── Keterangan ── */}
              <FormField
                control={form.control}
                name="keterangan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keterangan (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Contoh: Barang sedang dalam pengiriman..."
                        className="w-full resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Actions ── */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Simpan Perubahan" : "Simpan Prospek"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
