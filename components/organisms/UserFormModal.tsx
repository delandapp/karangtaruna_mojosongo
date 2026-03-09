"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ComboBox } from "@/components/ui/combobox";
import { ComboBoxItem } from "@/lib/types/form.types";
import { useGetJabatansQuery } from "@/features/api/jabatanApi";
import { useGetLevelsQuery } from "@/features/api/levelApi";
import { useCreateUserMutation, useUpdateUserMutation } from "@/features/api/userApi";

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

interface UserFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

export function UserFormModal({
  isOpen,
  onOpenChange,
  onSuccess,
  initialData,
}: UserFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const title = isEditing ? "Edit Data Anggota" : "Tambah Anggota Baru";
  const desc = isEditing
    ? "Perbarui informasi anggota."
    : "Isi formulir untuk menambahkan anggota ke dalam master data.";

  const { data: jabatansRes, isFetching: isLoadingJabatans } = useGetJabatansQuery({ filter: { dropdown: true } }, { skip: !isOpen });
  const { data: levelsRes, isFetching: isLoadingLevels } = useGetLevelsQuery({ filter: { dropdown: true } }, { skip: !isOpen });

  const jabatansData = jabatansRes?.data || [];
  const levelsData = levelsRes?.data || [];

  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();

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

      if (!payload.password) delete payload.password;
      if (payload.m_jabatan_id === 0) delete payload.m_jabatan_id;
      if (payload.m_level_id === 0) delete payload.m_level_id;
      if (!payload.jenis_kelamin) delete payload.jenis_kelamin;

      if (isEditing) {
        await updateUser({ id: initialData.id, data: payload }).unwrap();
      } else {
        await createUser(payload).unwrap();
      }

      toast.success(
        isEditing ? "Berhasil diperbarui" : "Berhasil ditambahkan",
        {
          description: `Data anggota ${data.nama_lengkap} telah disimpan.`,
        },
      );
      onSuccess();
    } catch (error: any) {
      toast.error("Gagal menyimpan data", {
        description: error?.data?.error?.message || "Kesalahan jaringan",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px] border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {desc}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pb-2"
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
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      onChange={field.onChange}
                      value={field.value || ""}
                    >
                      <option value="">Pilih...</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
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

            <div className="grid grid-cols-2 gap-4 pt-2 mt-4 border-t border-border/50">
              <FormField
                control={form.control}
                name="m_jabatan_id"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Jabatan</FormLabel>
                    <ComboBox
                      data={jabatansData.map((j: any) => ({ id: j.id.toString(), nama: j.nama_jabatan }))}
                      selected={field.value ? field.value.toString() : ""}
                      onChange={(val) => {
                        const parsed = typeof val === "string" ? parseInt(val, 10) : parseInt(val.id, 10);
                        field.onChange(parsed);
                      }}
                      title="Jabatan"
                      disabled={isLoadingJabatans}
                    />
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="m_level_id"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Hak Akses Level</FormLabel>
                    <ComboBox
                      data={levelsData.map((l: any) => ({ id: l.id.toString(), nama: l.nama_level }))}
                      selected={field.value ? field.value.toString() : ""}
                      onChange={(val) => {
                        const parsed = typeof val === "string" ? parseInt(val, 10) : parseInt(val.id, 10);
                        field.onChange(parsed);
                      }}
                      title="Level Akses"
                      disabled={isLoadingLevels}
                    />
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
      </DialogContent>
    </Dialog>
  );
}
