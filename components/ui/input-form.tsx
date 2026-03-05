/**
 * @component InputForm
 * @description Reusable input field dengan integrasi React Hook Form, validasi error, dan icon prefix/suffix.
 *
 * @example — Input biasa
 * ```tsx
 * <InputForm name="username" label="Username" control={control} />
 * ```
 *
 * @example — Dengan icon prefix
 * ```tsx
 * import { User } from "lucide-react";
 * <InputForm name="username" label="Username" control={control} prefixIcon={<User />} />
 * ```
 *
 * @example — Dengan icon suffix (toggle password)
 * ```tsx
 * import { Eye } from "lucide-react";
 * <InputForm name="password" type="password" label="Password" control={control}
 *   suffixIcon={<Eye />} onSuffixClick={() => setShow(!show)} />
 * ```
 *
 * @example — Dengan pesan error manual (dari server)
 * ```tsx
 * <InputForm name="username" label="Username" control={control} serverError="Username sudah dipakai" />
 * ```
 *
 * @props
 * - name          : keyof FormValues — field name (wajib)
 * - control       : Control<FormValues> — dari useForm()
 * - label         : string — label yang ditampilkan
 * - placeholder   : string — placeholder input
 * - type          : string — "text" | "password" | "email" | dst. (default: "text")
 * - prefixIcon    : ReactNode — icon di sebelah kiri input
 * - suffixIcon    : ReactNode — icon di sebelah kanan input (bisa klik)
 * - onSuffixClick : () => void — callback saat icon suffix diklik
 * - serverError   : string — pesan error dari server/API
 * - disabled      : boolean
 * - className     : string — kelas tambahan untuk wrapper
 */

"use client";

import React from "react";
import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface InputFormProps<T extends FieldValues> {
    name: Path<T>;
    control: Control<T>;
    label?: string;
    placeholder?: string;
    type?: string;
    prefixIcon?: React.ReactNode;
    suffixIcon?: React.ReactNode;
    onSuffixClick?: () => void;
    serverError?: string;
    disabled?: boolean;
    className?: string;
}

export function InputForm<T extends FieldValues>({
    name,
    control,
    label,
    placeholder,
    type = "text",
    prefixIcon,
    suffixIcon,
    onSuffixClick,
    serverError,
    disabled = false,
    className,
}: InputFormProps<T>) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field, fieldState }) => {
                const errorMessage = fieldState.error?.message || serverError;
                const hasError = Boolean(errorMessage);

                return (
                    <div className={cn("flex flex-col gap-1.5", className)}>
                        {/* Label */}
                        {label && (
                            <Label
                                htmlFor={String(name)}
                                className={cn(
                                    "text-sm font-medium transition-colors",
                                    hasError ? "text-destructive" : "text-foreground/80"
                                )}
                            >
                                {label}
                            </Label>
                        )}

                        {/* Input Wrapper */}
                        <div className="relative flex items-center">
                            {/* Prefix Icon */}
                            {prefixIcon && (
                                <span className="absolute left-3 flex items-center justify-center text-muted-foreground [&>svg]:size-4">
                                    {prefixIcon}
                                </span>
                            )}

                            {/* Input */}
                            <Input
                                {...field}
                                id={String(name)}
                                type={type}
                                placeholder={placeholder}
                                disabled={disabled}
                                aria-invalid={hasError}
                                aria-describedby={hasError ? `${String(name)}-error` : undefined}
                                className={cn(
                                    "transition-all duration-200",
                                    prefixIcon && "pl-10",
                                    suffixIcon && "pr-10",
                                    hasError && [
                                        "border-destructive",
                                        "focus-visible:ring-destructive/30",
                                        "animate-[shake_0.35s_ease-in-out]",
                                    ]
                                )}
                            />

                            {/* Suffix Icon */}
                            {suffixIcon && (
                                <span
                                    className={cn(
                                        "absolute right-3 flex items-center justify-center text-muted-foreground [&>svg]:size-4",
                                        onSuffixClick && "cursor-pointer hover:text-foreground transition-colors"
                                    )}
                                    onClick={onSuffixClick}
                                    role={onSuffixClick ? "button" : undefined}
                                    tabIndex={onSuffixClick ? 0 : undefined}
                                    onKeyDown={
                                        onSuffixClick
                                            ? (e) => e.key === "Enter" && onSuffixClick()
                                            : undefined
                                    }
                                >
                                    {suffixIcon}
                                </span>
                            )}
                        </div>

                        {/* Error Message */}
                        {hasError && (
                            <p
                                id={`${String(name)}-error`}
                                role="alert"
                                className="flex items-center gap-1 text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="size-3 shrink-0"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {errorMessage}
                            </p>
                        )}
                    </div>
                );
            }}
        />
    );
}
