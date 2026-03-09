import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { PromoBanner } from "@/components/organisms/PromoBanner";
import { OverviewCards } from "@/components/organisms/OverviewCards";
import { SalesChart } from "@/components/organisms/SalesChart";
import { DataTable } from "@/components/organisms/tables/DataTable";

export default function DashboardPage() {
  return (
    <div className="flex flex-col">
      <DashboardHeader breadcrumb="Dashboard" />

      <div className="flex flex-col gap-6 p-6">
        {/* Promo Banner */}
        <PromoBanner />

        {/* Overview Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Ringkasan</h2>
            <span className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
              30 hari terakhir
            </span>
          </div>
          <OverviewCards />
        </section>

        {/* Charts */}
        <SalesChart />

        {/* Data Table */}
        <DataTable />
      </div>
    </div>
  );
}
