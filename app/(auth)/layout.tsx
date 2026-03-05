import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Layout untuk grup route (auth): /login dan /register
 * Mendukung light mode dan dark mode dengan gradient dan glassmorphism.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-violet-50/30 dark:from-[#0a0a0f] dark:via-[#0d0d15] dark:to-[#0a0a0f]">
      {/* Ambient gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Blob kiri atas — biru/indigo */}
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-200/40 dark:bg-indigo-600/20 blur-[120px]" />
        {/* Blob kanan bawah — violet */}
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-violet-200/40 dark:bg-violet-600/20 blur-[120px]" />
        {/* Blob tengah — cyan */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-cyan-100/30 dark:bg-cyan-500/10 blur-[100px]" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.2) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0,0,0,0.2) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
