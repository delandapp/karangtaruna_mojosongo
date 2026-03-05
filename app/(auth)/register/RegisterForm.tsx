"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  UserPlus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { InputForm } from "@/components/ui/input-form";
import { ButtonForm } from "@/components/ui/button-form";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { registerSchema } from "@/lib/validations/auth.schema";

// Hanya field yang ada di form register (subset dari registerSchema)
const formSchema = z
  .object({
    nama_lengkap: registerSchema.shape.nama_lengkap,
    username: registerSchema.shape.username,
    password: registerSchema.shape.password,
    confirmPassword: z.string().min(1, "Konfirmasi password harus diisi"),
    no_handphone: registerSchema.shape.no_handphone,
    rt: registerSchema.shape.rt,
    rw: registerSchema.shape.rw,
    alamat: registerSchema.shape.alamat,
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<Record<string, string>>({});

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama_lengkap: "",
      username: "",
      password: "",
      confirmPassword: "",
      no_handphone: "",
      rt: "",
      rw: "",
      alamat: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setServerError({});

    const { confirmPassword, ...payload } = data;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          const msg: string = json.message || "Data sudah terdaftar";
          if (msg.toLowerCase().includes("username")) {
            setServerError({ username: msg });
          } else if (msg.toLowerCase().includes("handphone")) {
            setServerError({ no_handphone: msg });
          }
          toast.error("Pendaftaran gagal", { description: msg });
        } else if (res.status === 400 && json.errors) {
          const errs: Record<string, string> = {};
          for (const e of json.errors) {
            if (e.field) errs[e.field] = e.message;
          }
          setServerError(errs);
          toast.error("Data tidak valid", {
            description: "Periksa kembali isian form Anda.",
          });
        } else {
          toast.error("Terjadi kesalahan", { description: json.message });
        }
        return;
      }

      toast.success("Akun berhasil dibuat!", {
        description: "Silakan login dengan akun Anda.",
      });

      router.push("/login");
    } catch {
      toast.error("Koneksi gagal", {
        description: "Periksa koneksi internet Anda dan coba lagi.",
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Card glassmorphism — dual theme */}
      <div className="relative rounded-2xl border border-border/50 bg-card/80 px-8 py-10 shadow-2xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
        {/* Theme toggle */}
        <div className="absolute right-4 top-4">
          <ThemeToggle size="sm" />
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/30">
            <ShieldCheck className="size-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Daftar Akun
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Karang Taruna Kelurahan Mojosongo
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-600 dark:text-violet-300">
            <Sparkles className="size-3" />
            Buat akun baru
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-4"
        >
          {/* Nama Lengkap */}
          <InputForm<FormValues>
            name="nama_lengkap"
            control={control}
            label="Nama Lengkap"
            placeholder="Masukkan nama lengkap"
            prefixIcon={<User />}
            serverError={serverError.nama_lengkap}
          />

          {/* Username */}
          <InputForm<FormValues>
            name="username"
            control={control}
            label="Username"
            placeholder="Masukkan username"
            prefixIcon={<User />}
            serverError={serverError.username}
          />

          {/* Password & Konfirmasi — 2 kolom di layar besar */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputForm<FormValues>
              name="password"
              control={control}
              label="Password"
              placeholder="Min. 8 karakter"
              type={showPassword ? "text" : "password"}
              prefixIcon={<Lock />}
              suffixIcon={showPassword ? <EyeOff /> : <Eye />}
              onSuffixClick={() => setShowPassword((v) => !v)}
              serverError={serverError.password}
            />
            <InputForm<FormValues>
              name="confirmPassword"
              control={control}
              label="Konfirmasi Password"
              placeholder="Ulangi password"
              type={showConfirm ? "text" : "password"}
              prefixIcon={<Lock />}
              suffixIcon={showConfirm ? <EyeOff /> : <Eye />}
              onSuffixClick={() => setShowConfirm((v) => !v)}
            />
          </div>

          {/* No Handphone */}
          <InputForm<FormValues>
            name="no_handphone"
            control={control}
            label="Nomor Handphone"
            placeholder="Contoh: 08123456789"
            type="tel"
            prefixIcon={<Phone />}
            serverError={serverError.no_handphone}
          />

          {/* RT & RW — 2 kolom */}
          <div className="grid grid-cols-2 gap-4">
            <InputForm<FormValues>
              name="rt"
              control={control}
              label="RT"
              placeholder="Contoh: 03"
              prefixIcon={<MapPin />}
              serverError={serverError.rt}
            />
            <InputForm<FormValues>
              name="rw"
              control={control}
              label="RW"
              placeholder="Contoh: 07"
              prefixIcon={<MapPin />}
              serverError={serverError.rw}
            />
          </div>

          {/* Alamat */}
          <InputForm<FormValues>
            name="alamat"
            control={control}
            label="Alamat (opsional)"
            placeholder="Masukkan alamat lengkap"
            prefixIcon={<MapPin />}
            serverError={serverError.alamat}
          />

          <ButtonForm
            isLoading={isSubmitting}
            loadingText="Mendaftarkan..."
            fullWidth
            icon={<UserPlus />}
            className="mt-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-violet-500/40 transition-all duration-300"
          >
            Buat Akun
          </ButtonForm>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-medium text-violet-600 transition-colors hover:text-violet-500 hover:underline dark:text-violet-400 dark:hover:text-violet-300"
          >
            Masuk di sini
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground/50">
        © {new Date().getFullYear()} Karang Taruna Mojosongo. All rights
        reserved.
      </p>
    </div>
  );
}
