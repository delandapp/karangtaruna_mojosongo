import { Metadata } from "next";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { UserTable } from "@/components/organisms/tables/UserTable";

export const metadata: Metadata = {
  title: "Data Master - User",
};

export default async function UserPage() {
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

          {/* User Table Component (Client Side) uses RTK Query internally */}
          <UserTable />
        </section>
      </div>
    </div>
  );
}
