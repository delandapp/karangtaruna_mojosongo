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
  LogIn,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { InputForm } from "@/components/ui/input-form";
import { ButtonForm } from "@/components/ui/button-form";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { loginSchema } from "@/lib/validations/auth.schema";

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<Record<string, string>>({});

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: LoginValues) => {
    setServerError({});
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setServerError({
            password: json.message || "Username atau password salah",
          });
          toast.error("Login gagal", {
            description: json.message || "Username atau password salah",
          });
        } else {
          toast.error("Terjadi kesalahan", { description: json.message });
        }
        return;
      }

      const token = json.data?.token;
      if (token) {
        document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
      }

      toast.success("Berhasil login!", {
        description: `Selamat datang, ${json.data?.user?.nama_lengkap ?? data.username}!`,
      });

      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Koneksi gagal", {
        description: "Periksa koneksi internet Anda dan coba lagi.",
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Card glassmorphism — dual theme */}
      <div className="relative rounded-2xl border border-border/50 bg-card/80 px-8 py-10 shadow-2xl shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
        {/* Theme toggle */}
        <div className="absolute right-4 top-4">
          <ThemeToggle size="sm" />
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="size-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Karang Taruna
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelurahan Mojosongo, Surakarta
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-600 dark:text-indigo-300">
            <Sparkles className="size-3" />
            Masuk ke sistem
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-5"
        >
          <InputForm<LoginValues>
            name="username"
            control={control}
            label="Username"
            placeholder="Masukkan username"
            prefixIcon={<User />}
            serverError={serverError.username}
          />

          <InputForm<LoginValues>
            name="password"
            control={control}
            label="Password"
            placeholder="Masukkan password"
            type={showPassword ? "text" : "password"}
            prefixIcon={<Lock />}
            suffixIcon={showPassword ? <EyeOff /> : <Eye />}
            onSuffixClick={() => setShowPassword((v) => !v)}
            serverError={serverError.password}
          />

          <ButtonForm
            isLoading={isSubmitting}
            loadingText="Memverifikasi..."
            fullWidth
            icon={<LogIn />}
            className="mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/40 transition-all duration-300"
          >
            Masuk
          </ButtonForm>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-medium text-indigo-600 transition-colors hover:text-indigo-500 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>

      {/* Footer branding */}
      <p className="mt-6 text-center text-xs text-muted-foreground/50">
        © {new Date().getFullYear()} Karang Taruna Mojosongo. All rights
        reserved.
      </p>
    </div>
  );
}
