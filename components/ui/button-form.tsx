/**
 * @component ButtonForm
 * @description Reusable submit button dengan integrasi React Hook Form, loading spinner, dan variant styling.
 *
 * @example — Submit button biasa
 * ```tsx
 * const { formState: { isSubmitting } } = useForm();
 * <ButtonForm isLoading={isSubmitting}>Login</ButtonForm>
 * ```
 *
 * @example — Dengan custom loading text
 * ```tsx
 * <ButtonForm isLoading={isSubmitting} loadingText="Memproses...">Simpan</ButtonForm>
 * ```
 *
 * @example — Variant outline dengan full width
 * ```tsx
 * <ButtonForm variant="outline" fullWidth>Batal</ButtonForm>
 * ```
 *
 * @example — Dengan icon prefix
 * ```tsx
 * import { LogIn } from "lucide-react";
 * <ButtonForm isLoading={isSubmitting} icon={<LogIn />}>Masuk</ButtonForm>
 * ```
 *
 * @props
 * - isLoading    : boolean — tampilkan spinner dan disable button
 * - loadingText  : string — teks saat loading (default: teks children)
 * - variant      : "default" | "outline" | "ghost" | "destructive" | "secondary" | "link"
 * - size         : "default" | "sm" | "lg" | "icon"
 * - fullWidth    : boolean — button mengisi lebar penuh container
 * - icon         : ReactNode — icon di sebelah kiri teks (tsembunyi saat loading)
 * - type         : "submit" | "button" | "reset" (default: "submit")
 * - disabled     : boolean
 * - onClick      : () => void — callback opsional
 * - className    : string
 * - children     : ReactNode — teks / konten button
 */

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

interface ButtonFormProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    loadingText?: string;
    fullWidth?: boolean;
    icon?: React.ReactNode;
    variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
    size?: "default" | "sm" | "lg" | "icon";
}

export function ButtonForm({
    isLoading = false,
    loadingText,
    fullWidth = false,
    icon,
    variant = "default",
    size = "default",
    type = "submit",
    disabled,
    onClick,
    className,
    children,
    ...props
}: ButtonFormProps) {
    const isDisabled = disabled || isLoading;

    return (
        <Button
            type={type}
            variant={variant}
            size={size}
            disabled={isDisabled}
            onClick={onClick}
            className={cn(
                "relative gap-2 transition-all duration-200",
                fullWidth && "w-full",
                isLoading && "cursor-not-allowed opacity-80",
                className
            )}
            {...props}
        >
            {/* Spinner saat loading */}
            {isLoading ? (
                <>
                    <Loader2 className="size-4 animate-spin shrink-0" />
                    <span>{loadingText || children}</span>
                </>
            ) : (
                <>
                    {/* Icon prefix (tersembunyi saat loading) */}
                    {icon && (
                        <span className="flex items-center [&>svg]:size-4 shrink-0">
                            {icon}
                        </span>
                    )}
                    <span>{children}</span>
                </>
            )}
        </Button>
    );
}
