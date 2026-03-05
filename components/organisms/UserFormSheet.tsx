"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
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

// Zod schema based on API requirements
const userFormSchema = z.object({
  nama_lengkap: z.string().min(3, "Minimal 3 karakter").max(100),
  username: z
    .string()
    .min(4, "Minimal 4 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Hanya huruf, angka, dan underscore"),
  password: z
    .string()
    .min(8, "Minimal 8 karakter")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Harus mengandung huruf besar, kecil, dan angka",
    )
    .optional()
    .or(z.literal("")),
  no_handphone: z
    .string()
    .min(10, "Minimal 10 digit")
    .max(15)
    .regex(/^[0-9]+$/, "Hanya angka"),
  rt: z.string().min(1, "Wajib diisi").max(5),
  rw: z.string().min(1, "Wajib diisi").max(5),
  alamat: z.string().optional(),
  jenis_kelamin: z.enum(["L", "P"]).optional().or(z.literal("")),
  m_jabatan_id: z.coerce.number().positive("Wajib dipilih").optional(),
  m_level_id: z.coerce.number().positive("Wajib dipilih").optional(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface Jabatan {
  id: number;
  nama_jabatan: string;
}

interface Level {
  id: number;
  nama_level: string;
}

interface UserFormSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any; // To prepopulate if editing
  jabatans: Jabatan[];
  levels: Level[];
}

export function UserFormSheet({
  isOpen,
  onOpenChange,
  onSuccess,
  initialData,
  jabatans,
  levels,
}: UserFormSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const title = isEditing ? "Edit Data Anggota" : "Tambah Anggota Baru";
  const desc = isEditing
    ? "Perbarui informasi anggota."
    : "Isi formulir untuk menambahkan anggota ke dalam master data.";

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema) as any,
    defaultValues: {
      nama_lengkap: "",
      username: "",
      password: "",
      no_handphone: "",
      rt: "",
      rw: "",
      alamat: "",
      jenis_kelamin: undefined,
      m_jabatan_id: undefined,
      m_level_id: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        form.reset({
          nama_lengkap: initialData.nama_lengkap || "",
          username: initialData.username || "",
          password: "", // Kosongkan password saat edit, jika tidak ingin mengubah
          no_handphone: initialData.no_handphone || "",
          rt: initialData.rt || "",
          rw: initialData.rw || "",
          alamat: initialData.alamat || "",
          jenis_kelamin: initialData.jenis_kelamin || undefined,
          m_jabatan_id: initialData.m_jabatan_id || undefined,
          m_level_id: initialData.m_level_id || undefined,
        });
      } else {
        form.reset(); // Reset form jika create
      }
    }
  }, [isOpen, isEditing, initialData, form]);

  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: any = { ...data };

      // Cleanup payload
      if (!payload.password) delete payload.password; // Saat edit dan tidak isi pass
      if (payload.m_jabatan_id === 0) delete payload.m_jabatan_id;
      if (payload.m_level_id === 0) delete payload.m_level_id;
      if (!payload.jenis_kelamin) delete payload.jenis_kelamin;

      const endpoint = isEditing
        ? `/api/users/${initialData.id}`
        : "/api/users";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        // Cek jika error validasi atau API logic error (misalnya Koordinator)
        toast.error("Gagal menyimpan data", {
          description: json.error?.message,
        });
        return;
      }

      toast.success(
        isEditing ? "Berhasil diperbarui" : "Berhasil ditambahkan",
        {
          description: `Data anggota ${data.nama_lengkap} telah disimpan.`,
        },
      );
      onSuccess(); // Close drawer & re-fetch
    } catch (error) {
      toast.error("Kesalahan jaringan", {
        description: "Gagal memproses data",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md w-full border-l-border/50 bg-card/95 backdrop-blur-xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl font-semibold text-foreground">
            {title}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            {desc}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pb-12"
          >
            <FormField
              control={form.control}
              name="nama_lengkap"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                      className="bg-muted/50 focus-visible:ring-primary/50"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="johndoe123"
                        {...field}
                        className="bg-muted/50 focus-visible:ring-primary/50"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="no_handphone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. HP/WA</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="081xxx"
                        {...field}
                        className="bg-muted/50 focus-visible:ring-primary/50"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEditing ? "Password Baru (Opsional)" : "Password"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={
                        isEditing
                          ? "Kosongkan jika tidak ingin merubah"
                          : "Password123*"
                      }
                      {...field}
                      className="bg-muted/50 focus-visible:ring-primary/50"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    Minimal 8 huruf, sertakan huruf besar dan angka
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jenis_kelamin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Kelamin</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-muted/50 focus:ring-primary/50">
                          <SelectValue placeholder="Pilih..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card/90 backdrop-blur border-border/50">
                        <SelectItem value="L">Laki-laki</SelectItem>
                        <SelectItem value="P">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="rt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RT</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="01"
                          {...field}
                          className="bg-muted/50 focus-visible:ring-primary/50"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rw"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RW</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="02"
                          {...field}
                          className="bg-muted/50 focus-visible:ring-primary/50"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="alamat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat Lengkap</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nama Jalan, Blok..."
                      {...field}
                      className="bg-muted/50 focus-visible:ring-primary/50"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
              <FormField
                control={form.control}
                name="m_jabatan_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jabatan</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(parseInt(v, 10))}
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-muted/50 focus:ring-primary/50">
                          <SelectValue placeholder="Pilih Jabatan..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card/90 backdrop-blur border-border/50">
                        {jabatans.map((j) => (
                          <SelectItem key={j.id} value={j.id.toString()}>
                            {j.nama_jabatan}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="m_level_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hak Akses Level</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(parseInt(v, 10))}
                      value={field.value ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-muted/50 focus:ring-primary/50">
                          <SelectValue placeholder="Pilih Akses..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card/90 backdrop-blur border-border/50">
                        {levels.map((l) => (
                          <SelectItem key={l.id} value={l.id.toString()}>
                            {l.nama_level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-6 flex justify-end gap-3">
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
                className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                {isEditing ? "Simpan Perubahan" : "Simpan Anggota"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
