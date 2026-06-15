import { Metadata } from "next";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { TagBeritaTable } from "@/components/organisms/tables/TagBeritaTable";

export const metadata: Metadata = {
  title: "Tag Berita",
};

export default function TagBeritaPage() {
  return (
    <div className="flex flex-col">
      <DashboardHeader breadcrumb="Berita / Tag" />
      <div className="flex flex-col gap-6 p-6">
        <section>
          <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Tag Berita</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kelola tag untuk mengelompokkan topik spesifik di dalam berita.
              </p>
            </div>
          </div>
          <TagBeritaTable />
        </section>
      </div>
    </div>
  );
}
