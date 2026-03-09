"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultipleComboBox } from "@/components/ui/combobox-multiple";
import { useGetJabatansQuery } from "@/features/api/jabatanApi";
import { useGetLevelsQuery } from "@/features/api/levelApi";
import { useCreateHakAksesMutation, useUpdateHakAksesMutation } from "@/features/api/hakAksesApi";

interface HakAksesFormModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any;
}

export function HakAksesFormModal({
    isOpen,
    onOpenChange,
    onSuccess,
    initialData,
}: HakAksesFormModalProps) {
    const isEditing = !!initialData;
    const [step, setStep] = useState(1);
    const totalSteps = isEditing ? 1 : 5;

    const [isSubmitting, setIsSubmitting] = useState(false);

    // General Form State
    const [namaFitur, setNamaFitur] = useState("");
    const [endpoint, setEndpoint] = useState("");

    // Step 2, 3, 4, 5 Form States (GET, POST, PUT, DELETE) or single form state for editing
    // Structure: { levels: string[], jabatans: string[] }
    const [methodState, setMethodState] = useState<{
        GET: { levels: string[]; jabatans: string[] };
        POST: { levels: string[]; jabatans: string[] };
        PUT: { levels: string[]; jabatans: string[] };
        DELETE: { levels: string[]; jabatans: string[] };
    }>({
        GET: { levels: ["all"], jabatans: ["all"] },
        POST: { levels: ["all"], jabatans: ["all"] },
        PUT: { levels: ["all"], jabatans: ["all"] },
        DELETE: { levels: ["all"], jabatans: ["all"] },
    });

    const { data: jabatansRes, isFetching: isLoadingJabatans } = useGetJabatansQuery({ filter: { dropdown: true } }, { skip: !isOpen });
    const { data: levelsRes, isFetching: isLoadingLevels } = useGetLevelsQuery({ filter: { dropdown: true } }, { skip: !isOpen });

    const jabatansData = jabatansRes?.data || [];
    const levelsData = levelsRes?.data || [];

    const [createHakAkses] = useCreateHakAksesMutation();
    const [updateHakAkses] = useUpdateHakAksesMutation();

    const levelOptions = [{ label: "Semua Level", value: "all" }, ...levelsData.map((l: any) => ({ label: l.nama_level, value: l.id.toString() }))];
    const jabatanOptions = [{ label: "Semua Jabatan", value: "all" }, ...jabatansData.map((j: any) => ({ label: j.nama_jabatan, value: j.id.toString() }))];

    useEffect(() => {
        if (isOpen) {
            if (isEditing && initialData) {
                setNamaFitur(initialData.nama_fitur);
                setEndpoint(initialData.endpoint);

                const loadedLevels = initialData.is_all_level
                    ? ["all"]
                    : initialData.rules?.filter((r: any) => r.level).map((r: any) => r.m_level_id?.toString()) || [];

                const loadedJabatans = initialData.is_all_jabatan
                    ? ["all"]
                    : initialData.rules?.filter((r: any) => r.jabatan).map((r: any) => r.m_jabatan_id?.toString()) || [];

                // For editing, we populate the specific method this ID corresponds to, or just one generic state
                const currentMethod = initialData.method as "GET" | "POST" | "PUT" | "DELETE";
                setMethodState((prev) => ({
                    ...prev,
                    [currentMethod]: {
                        levels: loadedLevels.length > 0 ? Array.from(new Set(loadedLevels)) : [],
                        jabatans: loadedJabatans.length > 0 ? Array.from(new Set(loadedJabatans)) : []
                    }
                }));
            } else {
                // Reset form Create
                setStep(1);
                setNamaFitur("");
                setEndpoint("");
                setMethodState({
                    GET: { levels: ["all"], jabatans: ["all"] },
                    POST: { levels: ["all"], jabatans: ["all"] },
                    PUT: { levels: ["all"], jabatans: ["all"] },
                    DELETE: { levels: ["all"], jabatans: ["all"] },
                });
            }
        }
    }, [isOpen, isEditing, initialData]);

    const handleLevelChange = (method: "GET" | "POST" | "PUT" | "DELETE", vals: string[]) => {
        // Logic for "all" option
        let newVals = [...vals];
        const prevState = methodState[method].levels;

        if (newVals.includes("all") && !prevState.includes("all")) {
            newVals = ["all"]; // If 'all' is clicked, select only 'all'
        } else if (newVals.length > 1 && newVals.includes("all")) {
            newVals = newVals.filter(v => v !== "all"); // If something else is clicked while 'all' is selected, remove 'all'
        }

        setMethodState(prev => ({
            ...prev,
            [method]: { ...prev[method], levels: newVals }
        }));
    };

    const handleJabatanChange = (method: "GET" | "POST" | "PUT" | "DELETE", vals: string[]) => {
        let newVals = [...vals];
        const prevState = methodState[method].jabatans;

        if (newVals.includes("all") && !prevState.includes("all")) {
            newVals = ["all"];
        } else if (newVals.length > 1 && newVals.includes("all")) {
            newVals = newVals.filter(v => v !== "all");
        }

        setMethodState(prev => ({
            ...prev,
            [method]: { ...prev[method], jabatans: newVals }
        }));
    };

    const getRulesFromSelection = (levels: string[], jabatans: string[]) => {
        const isAllLevel = levels.includes("all") || levels.length === 0;
        const isAllJabatan = jabatans.includes("all") || jabatans.length === 0;

        let rules: any[] = [];

        // Create permutations of selected levels and jabatans if both specified
        if (!isAllLevel && !isAllJabatan) {
            levels.forEach(l => {
                jabatans.forEach(j => {
                    rules.push({ m_level_id: parseInt(l, 10), m_jabatan_id: parseInt(j, 10) });
                });
            });
        } else if (!isAllLevel && isAllJabatan) {
            levels.forEach(l => {
                rules.push({ m_level_id: parseInt(l, 10), m_jabatan_id: null });
            });
        } else if (isAllLevel && !isAllJabatan) {
            jabatans.forEach(j => {
                rules.push({ m_level_id: null, m_jabatan_id: parseInt(j, 10) });
            });
        }

        return { is_all_level: isAllLevel, is_all_jabatan: isAllJabatan, rules };
    }

    const nextStep = () => {
        if (step === 1 && (!namaFitur || !endpoint)) {
            toast.error("Validasi gagal", { description: "Nama fitur dan endpoint wajib diisi." });
            return;
        }
        setStep((prev) => Math.min(prev + 1, totalSteps));
    };
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

    const onSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (isEditing) {
                // Edit just the single method rules
                const currentMethod = initialData.method as "GET" | "POST" | "PUT" | "DELETE";
                const state = methodState[currentMethod];
                const payload = getRulesFromSelection(state.levels, state.jabatans);

                await updateHakAkses({ id: initialData.id, data: payload }).unwrap();
            } else {
                // Create 4 records
                const methods: ("GET" | "POST" | "PUT" | "DELETE")[] = ["GET", "POST", "PUT", "DELETE"];
                const payload = methods.map(method => {
                    const state = methodState[method];
                    const ruleObj = getRulesFromSelection(state.levels, state.jabatans);
                    return {
                        nama_fitur: namaFitur,
                        tipe_fitur: method === "GET" ? "read" : method === "POST" ? "create" : method === "PUT" ? "update" : "delete",
                        endpoint: endpoint,
                        method: method,
                        ...ruleObj
                    };
                });

                await createHakAkses(payload).unwrap();
            }

            toast.success(
                isEditing ? "Berhasil diperbarui" : "Berhasil ditambahkan",
                {
                    description: `Hak Akses ${namaFitur} telah disimpan.`,
                },
            );
            onSuccess();
        } catch (error: any) {
            toast.error("Gagal menyimpan data", {
                description: error?.data?.error?.message || "Kesalahan jaringan",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getMethodForStep = (currentStep: number): "GET" | "POST" | "PUT" | "DELETE" => {
        switch (currentStep) {
            case 2: return "GET";
            case 3: return "POST";
            case 4: return "PUT";
            case 5: return "DELETE";
            default: return isEditing ? initialData.method : "GET";
        }
    }

    const currentMethod = getMethodForStep(step);
    const title = isEditing
        ? `Edit Hak Akses [${initialData.method}]`
        : step === 1
            ? "Buat Fitur Baru"
            : `Atur Hak Akses: Method ${currentMethod}`;

    const desc = isEditing
        ? `Perbarui hak akses untuk fitur ${initialData.nama_fitur}.`
        : step === 1
            ? "Masukkan nama dan base endpoint. Sistem akan otomatis mengisi method GET, POST, PUT, DELETE."
            : `Pilih Level dan Jabatan yang berhak mengakses fitur ${namaFitur} melalui method ${currentMethod}.`;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px] border-border/50 bg-card/95 backdrop-blur-xl rounded-2xl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl font-semibold text-foreground">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground mt-2">
                        {desc}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pb-2">
                    {!isEditing && (
                        <div className="flex justify-between items-center mb-6">
                            <div className="text-sm font-medium text-muted-foreground">Langkah {step} dari {totalSteps}</div>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <div key={s} className={`h-1.5 w-8 rounded-full ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 1 && !isEditing ? (
                        // Step 1: Fitur Name & Endpoint
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="namaFitur">Nama Fitur</Label>
                                <Input
                                    id="namaFitur"
                                    placeholder="Contoh: Sponsorship Brand"
                                    value={namaFitur}
                                    onChange={(e) => setNamaFitur(e.target.value)}
                                    className="bg-muted/50 focus-visible:ring-primary/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endpoint">Base Endpoint</Label>
                                <Input
                                    id="endpoint"
                                    placeholder="Contoh: /api/sponsorship/brand"
                                    value={endpoint}
                                    onChange={(e) => setEndpoint(e.target.value)}
                                    className="bg-muted/50 focus-visible:ring-primary/50"
                                />
                            </div>
                        </div>
                    ) : (
                        // Step 2, 3, 4, 5 (or Step 1 Editing): Rules Comboboxes
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-secondary-foreground font-semibold">Tentukan Level yang diijinkan</Label>
                                <p className="text-xs text-muted-foreground mb-2">Biarkan <b>"Semua Level"</b> terpilih jika method ini bisa diakses semua level tanpa batasan.</p>
                                <MultipleComboBox
                                    options={levelOptions}
                                    selected={methodState[currentMethod].levels}
                                    onChange={(vals) => handleLevelChange(currentMethod, vals)}
                                    placeholder="Pilih Level"
                                    emptyText="Level tidak ditemukan"
                                    disabled={isLoadingLevels}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-secondary-foreground font-semibold">Tentukan Jabatan yang diijinkan</Label>
                                <p className="text-xs text-muted-foreground mb-2">Biarkan <b>"Semua Jabatan"</b> terpilih jika method ini bisa diakses semua jabatan tanpa batasan.</p>
                                <MultipleComboBox
                                    options={jabatanOptions}
                                    selected={methodState[currentMethod].jabatans}
                                    onChange={(vals) => handleJabatanChange(currentMethod, vals)}
                                    placeholder="Pilih Jabatan"
                                    emptyText="Jabatan tidak ditemukan"
                                    disabled={isLoadingJabatans}
                                />
                            </div>

                            <div className="p-3 bg-muted/30 border border-border/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">
                                    <b>Catatan:</b> Jika both level dan jabatan dipilih spesifik, pengguna wajib memiliki <span className="text-primary font-bold">Level DAN Jabatan</span> tersebut untuk bisa mengakses.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="pt-6 flex justify-between gap-3 border-t border-border/50 mt-6">
                        {!isEditing && step > 1 ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={prevStep}
                                disabled={isSubmitting}
                                className="bg-transparent border-border/50"
                            >
                                <ArrowLeft className="mr-2 size-4" />
                                Kembali
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                disabled={isSubmitting}
                                className="text-muted-foreground"
                            >
                                Batal
                            </Button>
                        )}

                        {!isEditing && step < totalSteps ? (
                            <Button
                                type="button"
                                onClick={nextStep}
                                className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
                            >
                                Selanjutnya
                                <ArrowRight className="ml-2 size-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={onSubmit}
                                disabled={isSubmitting}
                                className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                ) : null}
                                {isEditing ? "Simpan Perubahan" : "Simpan Hak Akses"}
                            </Button>
                        )}
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
