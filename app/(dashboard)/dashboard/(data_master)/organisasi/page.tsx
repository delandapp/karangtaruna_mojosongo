"use client";

import { useState } from "react";
import { Plus, Search, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";
import { CustomPagination } from "@/components/molecules/CustomPagination";
import { OrganisasiCard } from "@/components/organisms/cards/OrganisasiCard";
import { OrganisasiFormModal } from "@/components/organisms/modals/master/OrganisasiFormModal";

import {
  useGetOrganisasisQuery,
  useDeleteOrganisasiMutation,
  Organisasi,
} from "@/features/api/organisasiApi";
import { debounce } from "@/utils/helpers/helper";

export default function OrganisasiPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrganisasi, setSelectedOrganisasi] =
    useState<Organisasi | null>(null);

  const {
    data: responseData,
    isLoading,
    isFetching,
    refetch,
  } = useGetOrganisasisQuery({
    page,
    limit: 12, // Using 12 so the grid can comfortably hold 3 or 4 columns
    search,
  });

  const [deleteOrganisasi] = useDeleteOrganisasiMutation();

  const organisasis = responseData?.data || [];
  const meta = responseData?.meta;

  const handleSearch = debounce((value: string) => {
    setSearch(value);
    setPage(1);
  }, 500);

  const handleOpenCreate = () => {
    setSelectedOrganisasi(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (org: Organisasi) => {
    setSelectedOrganisasi(org);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number, nama: string) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus data organisasi ${nama}?`,
      )
    )
      return;

    try {
      await deleteOrganisasi(id).unwrap();
      toast.success("Berhasil dihapus", {
        description: `Data organisasi ${nama} telah dihapus.`,
      });
    } catch (error: any) {
      toast.error("Gagal menghapus", {
        description:
          error?.data?.error?.message ||
          "Terjadi kesalahan saat menghapus data.",
      });
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    refetch();
  };

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader breadcrumb="Data Master / Organisasi" />

      <div className="flex flex-col gap-6 p-6 flex-1 bg-muted/10">
        <section>
          <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Data Organisasi Karang Taruna
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kelola direktori profil berbagai organisasi Karang Taruna di
                tingkat wilayah.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Toolbar */}
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div className="flex w-full items-center gap-2 md:w-auto flex-wrap md:flex-nowrap">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama organisasi atau kelurahan..."
                    className="w-full bg-card/50 pl-9 backdrop-blur focus-visible:ring-primary/50 border-border/60"
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="shrink-0 bg-card/50 backdrop-blur border-border/60"
                >
                  <RefreshCw
                    className={`size-4 ${isFetching ? "animate-spin text-muted-foreground" : "text-foreground"}`}
                  />
                </Button>
                <Button
                  onClick={handleOpenCreate}
                  className="shrink-0 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
                >
                  <Plus className="mr-2 size-4" /> Tambah Data
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-[360px] animate-pulse bg-card/50 rounded-xl border border-border/50"
                  ></div>
                ))}
              </div>
            ) : organisasis.length === 0 ? (
              <div className="rounded-xl border border-border/50 bg-card/80 shadow-sm backdrop-blur flex flex-col w-full items-center justify-center p-12 py-32">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Tidak ada data Organisasi
                </h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm text-center">
                  {search
                    ? "Pencarian Anda tidak cocok dengan organisasi mana pun. Coba kata kunci lain."
                    : "Belum ada data detail organisasi yang tersimpan."}
                </p>
                {!search && (
                  <Button
                    variant="outline"
                    className="mt-6 border-border/60"
                    onClick={handleOpenCreate}
                  >
                    <Plus className="mr-2 size-4" /> Tambah Data Organisasi
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {organisasis.map((org: Organisasi) => (
                  <OrganisasiCard
                    key={org.id}
                    organisasi={org}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/50 px-4 py-4 sm:px-6 bg-card/50 rounded-xl mt-4">
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Menampilkan{" "}
                  <span className="font-medium text-foreground">
                    {(page - 1) * 12 + 1}
                  </span>{" "}
                  hingga{" "}
                  <span className="font-medium text-foreground">
                    {Math.min(page * 12, meta.total)}
                  </span>{" "}
                  dari{" "}
                  <span className="font-medium text-foreground">
                    {meta.total}
                  </span>{" "}
                  organisasi
                </p>
                <CustomPagination
                  currentPage={page}
                  totalPages={meta.totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </section>
      </div>

      {isFormOpen && (
        <OrganisasiFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
          initialData={selectedOrganisasi}
        />
      )}
    </div>
  );
}
