import { Metadata } from "next";
import { DashboardHeader } from "@/components/organisms/DashboardHeader";
import { UserTable } from "@/components/organisms/UserTable";
// Asumsi API bisa diakses direct server, tapi karena ada Session dan Token dari JWT Cookie,
// Kita fetch daftar jabatan dan level secara statis dari DB di server component untuk Tabs & dropdown form.
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Data Master - User",
};

export default async function UserPage() {
  // Fetch referensi data untuk Tabs filter dan Dropdown select di Form
  const [jabatans, levels] = await Promise.all([
    prisma.m_jabatan.findMany({
      select: { id: true, nama_jabatan: true },
      orderBy: { id: "asc" },
    }),
    prisma.m_level.findMany({
      select: { id: true, nama_level: true },
      orderBy: { id: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col">
      <DashboardHeader breadcrumb="Data Master / User" />

      <div className="flex flex-col gap-6 p-6">
        <section>
          <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Manajemen Anggota
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kelola data anggota Karang Taruna dan peran mereka.
              </p>
            </div>
          </div>

          {/* User Table Component (Client Side) */}
          <UserTable jabatans={jabatans} levels={levels} />
        </section>
      </div>
    </div>
  );
}
