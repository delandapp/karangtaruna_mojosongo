import Image from 'next/image';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────
   Logo Component
   
   3 variants:
   • "logo"          → logo image only
   • "with-text"     → logo + "Karang Taruna" / "Kelurahan Mojosongo"
   • "with-text-bg"  → logo + text + background card
   
   All props are optional for full customisation.
   ───────────────────────────────────────── */

type LogoVariant = 'logo' | 'with-text' | 'with-text-bg';

interface LogoProps {
  /** Display variant */
  variant?: LogoVariant;
  /** Logo image size in px (width & height) */
  size?: number;
  /** Title text (default: "Karang Taruna") */
  title?: string;
  /** Subtitle text (default: "Kelurahan Mojosongo") */
  subtitle?: string;
  /** Title colour */
  titleColor?: string;
  /** Subtitle colour */
  subtitleColor?: string;
  /** Background style for "with-text-bg" variant */
  bgClassName?: string;
  /** Additional wrapper className */
  className?: string;
  /** Theme: "light" renders dark text, "dark" renders white text */
  theme?: 'light' | 'dark';
  /** onClick handler */
  onClick?: () => void;
}

const DEFAULTS = {
  title: 'Karang Taruna',
  subtitle: 'Kelurahan Mojosongo',
  size: 44,
} as const;

export default function Logo({
  variant = 'logo',
  size = DEFAULTS.size,
  title = DEFAULTS.title,
  subtitle = DEFAULTS.subtitle,
  titleColor,
  subtitleColor,
  bgClassName,
  className,
  theme = 'light',
  onClick,
}: LogoProps) {
  const isDark = theme === 'dark';

  /* ── Resolved colours ── */
  const resolvedTitleColor = titleColor ?? (isDark ? '#ffffff' : '#1a1a1a');
  const resolvedSubtitleColor = subtitleColor ?? (isDark ? 'rgba(255,255,255,0.6)' : '#6b7280');

  /* ── Logo image ── */
  const logoImage = (
    <Image
      src="/image/logo/logo.png"
      alt={`${title} — ${subtitle}`}
      width={size}
      height={size}
      className="object-contain shrink-0 rounded-full"
      priority
    />
  );

  /* ── Variant: logo only ── */
  if (variant === 'logo') {
    return (
      <div
        className={cn('inline-flex items-center', onClick && 'cursor-pointer', className)}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
      >
        {logoImage}
      </div>
    );
  }

  /* ── Text block (shared by with-text and with-text-bg) ── */
  const textBlock = (
    <div className="flex flex-col justify-center min-w-0">
      <span
        className="font-semibold leading-tight truncate"
        style={{
          fontFamily: 'var(--font-poppins), Poppins, sans-serif',
          color: resolvedTitleColor,
          fontSize: Math.max(size * 0.36, 14),
        }}
      >
        {title}
      </span>
      <span
        className="font-normal truncate"
        style={{
          fontFamily: 'var(--font-poppins), Poppins, sans-serif',
          color: resolvedSubtitleColor,
          fontSize: Math.max(size * 0.24, 10),
          letterSpacing: '0.32em',

        }}
      >
        {subtitle}
      </span>
    </div>
  );

  /* ── Variant: with-text ── */
  if (variant === 'with-text') {
    return (
      <div
        className={cn('inline-flex items-center gap-3', onClick && 'cursor-pointer', className)}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
      >
        {logoImage}
        {textBlock}
      </div>
    );
  }

  /* ── Variant: with-text-bg ── */
  return (
    <div
      className={cn(
        'inline-flex items-center gap-3 rounded-xl px-4 py-2.5',
        isDark
          ? 'bg-white/8 border border-white/10 backdrop-blur-md'
          : 'bg-white border border-neutral-200 shadow-sm',
        bgClassName,
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {logoImage}
      {textBlock}
    </div>
  );
}
