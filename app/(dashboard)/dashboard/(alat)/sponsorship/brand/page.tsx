"use client";

import { useState } from "react";
import { Plus, Search, MapPin, Building2, Tag, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CustomPagination } from "@/components/molecules/CustomPagination";
import { MultipleComboBox, Option } from "@/components/ui/combobox-multiple";
import { DashboardHeader } from "@/components/organisms/headers/DashboardHeader";

// RTK Query hooks
import { 
    useGetBrandsQuery, 
    useCreateBrandMutation 
} from "@/features/api/brandApi";
import { useGetBidangBrandsQuery } from "@/features/api/bidangBrandApi";
import { useGetKategoriBrandsQuery } from "@/features/api/kategoriBrandApi";
import { BrandFormModal } from "@/components/organisms/modals/sponsorship/BrandFormModal"; // We will create this
import { debounce } from "@/utils/helpers/helper";

export default function BrandsPage() {
    // Local State
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [selectedBidangId, setSelectedBidangId] = useState<string[]>([]);
    const [selectedKategoriId, setSelectedKategoriId] = useState<string[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState<any>(null);

    // Queries
    const { 
        data: responseData, 
        isLoading, 
        isFetching,
        refetch
    } = useGetBrandsQuery({
        page,
        limit: 10,
        search,
        m_bidang_brand_id: selectedBidangId,
        m_kategori_brand_id: selectedKategoriId
    });

    const { data: bResponse } = useGetBidangBrandsQuery({ filter: { dropdown: true } });
    const { data: kResponse } = useGetKategoriBrandsQuery({ filter: { dropdown: true } });

    // Format options for ComboBox
    const bidangOptions: Option[] = bResponse?.data?.map((b: any) => ({
        label: b.nama_bidang,
        value: b.id.toString(),
    })) || [];

    const kategoriOptions: Option[] = kResponse?.data?.map((k: any) => ({
        label: k.nama_kategori,
        value: k.id.toString(),
    })) || [];

    const brands = responseData?.data || [];
    const meta = responseData?.meta;

    // Handlers
    const handleSearch = debounce((value: string) => {
        setSearch(value);
        setPage(1);
    }, 500);

    const handleOpenCreate = () => {
        setSelectedBrand(null);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (brand: any) => {
        setSelectedBrand(brand);
        setIsFormOpen(true);
    };

    const handleFormSuccess = () => {
        setIsFormOpen(false);
        refetch();
    };

    return (
        <div className="flex flex-col">
            <DashboardHeader breadcrumb="Sponsorship / Alat / Sponsorship Brand" />

            <div className="flex flex-col gap-6 p-6">
                <section>
                    <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">
                                Daftar Sponsorship Brand
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Kelola data brand sponsorship Anda beserta informasi kontaknya.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Toolbar */}
                        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                            <div className="flex w-full items-center gap-2 md:w-auto flex-wrap md:flex-nowrap">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Cari nama brand..."
                                        className="w-full bg-card/50 pl-9 backdrop-blur focus-visible:ring-primary/50"
                                        onChange={(e) => handleSearch(e.target.value)}
                                    />
                                </div>
                                <div className="w-full md:w-48">
                                    <MultipleComboBox 
                                        options={bidangOptions}
                                        selected={selectedBidangId}
                                        onChange={(val) => {
                                            setSelectedBidangId(val); 
                                            setPage(1); 
                                        }}
                                        placeholder="Filter Bidang"
                                        emptyText="Bidang tidak ditemukan"
                                    />
                                </div>
                                <div className="w-full md:w-48">
                                    <MultipleComboBox 
                                        options={kategoriOptions}
                                        selected={selectedKategoriId}
                                        onChange={(val) => { 
                                            setSelectedKategoriId(val); 
                                            setPage(1); 
                                        }}
                                        placeholder="Filter Kategori"
                                        emptyText="Kategori tidak ditemukan"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => refetch()}
                                    disabled={isFetching}
                                    className="shrink-0 bg-card/50 backdrop-blur"
                                >
                                    <RefreshCw className={`size-4 ${isFetching ? "animate-spin text-muted-foreground" : "text-foreground"}`} />
                                </Button>
                                <Button onClick={handleOpenCreate} className="shrink-0 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30">
                                    <Plus className="mr-2 size-4" /> Tambah Data
                                </Button>
                            </div>
                        </div>

                        {/* Data Representation */}
                        {isLoading ? (
                            <div className="space-y-4 w-full">
                                {[1, 2, 3].map((i) => (
                                    <Card key={i} className="w-full overflow-hidden border-border/50 bg-card/50 backdrop-blur">
                                        <CardContent className="p-0">
                                            <div className="p-4 flex gap-4">
                                                <Skeleton className="h-16 w-16 shrink-0 rounded-md" />
                                                <div className="space-y-2 w-full">
                                                    <Skeleton className="h-5 w-[200px]" />
                                                    <Skeleton className="h-4 w-[150px]" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : brands.length === 0 ? (
                            <div className="rounded-xl border border-border/50 bg-card/50 shadow-sm backdrop-blur flex flex-col w-full items-center justify-center p-12 py-24">
                                <div className="rounded-full bg-primary/10 p-3 mb-4">
                                    <Search className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-medium text-foreground">Tidak ada data Brand</h3>
                                <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">
                                    {search || selectedBidangId.length > 0 || selectedKategoriId.length > 0 
                                        ? "Coba ubah filter pencarian Anda untuk menemukan hasil."
                                        : "Silakan tambahkan data brand pertama Anda."}
                                </p>
                                {!(search || selectedBidangId.length > 0 || selectedKategoriId.length > 0) && (
                                    <Button variant="outline" className="mt-4 shadow-sm" onClick={handleOpenCreate}>
                                        <Plus className="mr-2 size-4" /> Tambah Data
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-border/50 bg-card/50 shadow-sm backdrop-blur overflow-hidden">
                                <div className="flex flex-col">
                                    {brands.map((brand: any, index: number) => (
                                        <div 
                                            key={brand.id}
                                            className={`flex flex-col sm:flex-row p-4 gap-4 md:items-center hover:bg-muted/40 transition-colors ${
                                                index !== brands.length - 1 ? 'border-b border-border/40' : ''
                                            }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-semibold text-base text-foreground truncate">{brand.nama_brand}</h4>
                                                    {brand.presentase_keberhasilan && (
                                                        <Badge variant={brand.presentase_keberhasilan >= 70 ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 h-5">
                                                            {brand.presentase_keberhasilan}% success
                                                        </Badge>
                                                    )}
                                                </div>
                                                
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                                                    {brand.perusahaan_induk && (
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <Building2 className="w-3.5 h-3.5" />
                                                            <span className="truncate">{brand.perusahaan_induk}</span>
                                                        </div>
                                                    )}
                                                    {brand.bidang && (
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <MapPin className="w-3.5 h-3.5" />
                                                            <span>{brand.bidang.nama_bidang}</span>
                                                        </div>
                                                    )}
                                                    {brand.kategori && (
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <Tag className="w-3.5 h-3.5" />
                                                            <span>{brand.kategori.nama_kategori}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex md:flex-col gap-2 shrink-0 justify-end sm:justify-start">
                                                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(brand)} className="bg-card/50 backdrop-blur border-border/50">
                                                    Detail / Edit
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {meta && meta.totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-border/50 px-4 py-3 sm:px-6 bg-muted/20 rounded-xl mt-2">
                                <div className="flex flex-1 justify-between sm:hidden">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Sebelumnya
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                                        disabled={page === meta.totalPages}
                                    >
                                        Selanjutnya
                                    </Button>
                                </div>
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Menampilkan <span className="font-medium text-foreground">{(page - 1) * 10 + 1}</span> hingga{" "}
                                            <span className="font-medium text-foreground">{Math.min(page * 10, meta.totalData)}</span> dari{" "}
                                            <span className="font-medium text-foreground">{meta.totalData}</span> hasil
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm bg-card" aria-label="Pagination">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-r-none border-border/50"
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                            >
                                                Tersebelum
                                            </Button>
                                            <div className="px-4 py-1.5 border-y border-border/50 text-sm font-medium text-foreground bg-muted/10">
                                                {page}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-l-none border-border/50"
                                                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                                                disabled={page === meta.totalPages}
                                            >
                                                Selanjutnya
                                            </Button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {isFormOpen && (
                <BrandFormModal
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={handleFormSuccess}
                    initialData={selectedBrand}
                    bidangOptions={bidangOptions}
                    kategoriOptions={kategoriOptions}
                />
            )}
        </div>
    );
}
