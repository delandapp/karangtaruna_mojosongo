"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ComboBox } from "@/components/ui/combobox";
import {
  useCreateEventMutation,
  useUpdateEventMutation,
  type JenisEvent,
  type StatusEvent,
} from "@/features/api/eventApi";
import { useGetOrganisasisQuery } from "@/features/api/organisasiApi";

// ── Enum options ───────────────────────────────────────────
const JENIS_OPTIONS: { value: JenisEvent; label: string }[] = [
  { value: "festival", label: "Festival" },
  { value: "lomba", label: "Lomba" },
  { value: "seminar", label: "Seminar" },
  { value: "bakti_sosial", label: "Bakti Sosial" },
  { value: "olahraga", label: "Olahraga" },
  { value: "seni_budaya", label: "Seni & Budaya" },
  { value: "pelatihan", label: "Pelatihan" },
  { value: "lainnya", label: "Lainnya" },
];

const STATUS_OPTIONS: { value: StatusEvent; label: string }[] = [
  { value: "perencanaan", label: "Perencanaan" },
  { value: "persiapan", label: "Persiapan" },
  { value: "siap", label: "Siap" },
  { value: "berlangsung", label: "Berlangsung" },
  { value: "selesai", label: "Selesai" },
  { value: "dibatalkan", label: "Dibatalkan" },
];

const JENIS_VALUES = JENIS_OPTIONS.map((o) => o.value) as [JenisEvent, ...JenisEvent[]];
const STATUS_VALUES = STATUS_OPTIONS.map((o) => o.value) as [StatusEvent, ...StatusEvent[]];

// ── Schema ────────────────────────────────────────────────
const toNum = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : Number(v));

const eventFormSchema = z.object({
  nama_event: z.string().min(3, "Minimal 3 karakter").max(200),
  tema_event: z.string().max(200).optional().or(z.literal("")),
  deskripsi: z.string().max(5000).optional().or(z.literal("")),
  jenis_event: z.enum(JENIS_VALUES, { error: "Jenis event wajib dipilih" }),
  status_event: z.enum(STATUS_VALUES).optional(),
  tanggal_mulai: z.date({ error: "Tanggal mulai wajib diisi" }),
  tanggal_selesai: z.date({ error: "Tanggal selesai wajib diisi" }),
  lokasi: z.string().max(255).optional().or(z.literal("")),
  target_peserta: z.preprocess(toNum, z.number().int().min(0).optional()),
  m_organisasi_id: z.preprocess(toNum, z.number().int().min(1, "ID Organisasi wajib diisi")),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

// ── Props ─────────────────────────────────────────────────
interface EventFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

// ── Date picker helper ────────────────────────────────────
function DatePickerField({
  value,
  onChange,
}: {
  value: Date | undefined;
  onChange: (d: Date) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-muted/50",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {value ? format(value, "dd MMM yyyy", { locale: localeId }) : "Pilih tanggal"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d: Date | undefined) => d && onChange(d)}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export function EventFormModal({
  isOpen,
  onOpenChange,
  onSuccess,
  initialData,
}: EventFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const [createEvent] = useCreateEventMutation();
  const [updateEvent] = useUpdateEventMutation();

  const { data: organisasiResponse, isLoading: isOrganisasiLoading } = useGetOrganisasisQuery({
    limit: 100, // Fetching all orgs for combobox
  });

  const organisasis = organisasiResponse?.data || [];

  // Format for combobox
  const organisasiOptions = organisasis.map((org: any) => ({
    id: org.id.toString(),
    nama: org.nama_org || "Organisasi",
  }));

  const form = useForm<EventFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(eventFormSchema) as any,
    defaultValues: {
      nama_event: "",
      tema_event: "",
      deskripsi: "",
      status_event: "perencanaan",
      lokasi: "",
      target_peserta: 0,
      m_organisasi_id: 1,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (isEditing && initialData) {
      form.reset({
        nama_event: initialData.nama_event || "",
        tema_event: initialData.tema_event || "",
        deskripsi: initialData.deskripsi || "",
        jenis_event: initialData.jenis_event,
        status_event: initialData.status_event || "perencanaan",
        tanggal_mulai: new Date(initialData.tanggal_mulai),
        tanggal_selesai: new Date(initialData.tanggal_selesai),
        lokasi: initialData.lokasi || "",
        target_peserta: initialData.target_peserta || 0,
        m_organisasi_id: initialData.m_organisasi_id || 1,
      });
    } else {
      form.reset();
    }
  }, [isOpen, isEditing, initialData, form]);

  const onSubmit = async (values: EventFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        m_organisasi_id: values.m_organisasi_id,
        nama_event: values.nama_event,
        jenis_event: values.jenis_event,
        status_event: values.status_event,
        tanggal_mulai: values.tanggal_mulai.toISOString(),
        tanggal_selesai: values.tanggal_selesai.toISOString(),
        tema_event: values.tema_event || undefined,
        deskripsi: values.deskripsi || undefined,
        lokasi: values.lokasi || undefined,
        target_peserta: values.target_peserta || undefined,
      };

      if (isEditing) {
        await updateEvent({ id: initialData.id, ...payload }).unwrap();
        toast.success("Event berhasil diperbarui", {
          description: `${values.nama_event} telah diperbarui.`,
        });
      } else {
        await createEvent(payload).unwrap();
        toast.success("Event berhasil ditambahkan", {
          description: `${values.nama_event} telah dibuat.`,
        });
      }
      onSuccess();
    } catch (error: any) {
      toast.error("Gagal menyimpan event", {
        description: error?.data?.error?.message || "Terjadi kesalahan",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Edit Event" : "Buat Event Baru"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {isEditing
              ? "Perbarui informasi event."
              : "Isi formulir untuk membuat event baru. Kode event dihasilkan otomatis."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pb-2">
            {/* Nama Event */}
            <FormField
              control={form.control}
              name="nama_event"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Event <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Festival Karang Taruna 2025..." {...field} className="bg-muted/50 focus-visible:ring-primary/50" />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Tema */}
            <FormField
              control={form.control}
              name="tema_event"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tema / Tagline</FormLabel>
                  <FormControl>
                    <Input placeholder="Tema atau tagline event..." {...field} className="bg-muted/50 focus-visible:ring-primary/50" />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Jenis + Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jenis_event"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Event <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-muted/50 focus:ring-primary/50 w-full">
                          <SelectValue placeholder="Pilih jenis..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {JENIS_OPTIONS.map((j) => (
                          <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status_event"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status Event</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} >
                      <FormControl>
                        <SelectTrigger className="bg-muted/50 focus:ring-primary/50 w-full">
                          <SelectValue placeholder="Pilih status..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Tanggal */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tanggal_mulai"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Mulai <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <DatePickerField value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tanggal_selesai"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Selesai <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <DatePickerField value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* Lokasi + Target */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lokasi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lokasi</FormLabel>
                    <FormControl>
                      <Input placeholder="GOR, Lapangan, Online..." {...field} className="bg-muted/50 focus-visible:ring-primary/50" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="target_peserta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Peserta</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="100" {...field} className="bg-muted/50 focus-visible:ring-primary/50" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* ID Organisasi */}
            <FormField
              control={form.control}
              name="m_organisasi_id"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ComboBox
                      label="Organisasi Pengusul"
                      selected={
                        field.value
                          ? organisasiOptions.find((o: any) => o.id === field.value.toString())
                          : null
                      }
                      onChange={(selectedItem: any) => {
                        field.onChange(selectedItem ? parseInt(selectedItem.id, 10) : undefined);
                      }}
                      data={organisasiOptions}
                      title="Organisasi"
                      valueKey="id"
                      labelKey="nama"
                      loadingSearch={isOrganisasiLoading}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Deskripsi */}
            <FormField
              control={form.control}
              name="deskripsi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Deskripsi singkat event..."
                      {...field}
                      className="bg-muted/50 focus-visible:ring-primary/50 resize-none"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="bg-transparent border-border/50"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              >
                {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {isEditing ? "Simpan Perubahan" : "Buat Event"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
