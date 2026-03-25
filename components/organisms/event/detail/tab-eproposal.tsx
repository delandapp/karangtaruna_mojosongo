'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Loader2, ExternalLink, Save, UploadCloud, Plus, Pencil, Trash2, ArrowUp, ArrowDown, ListOrdered } from 'lucide-react';
import { toast } from 'react-hot-toast';

import {
  useGetEProposalByEventIdQuery,
  useCreateEProposalMutation,
  useUpdateEProposalMutation,
  type EProposalDaftarIsi,
} from '@/features/api/eproposalApi';
import { useUploadFileMutation } from '@/features/api/storageApi';
import { S3_BUCKETS } from '@/lib/constants';

interface TabEProposalProps {
  eventId: number;
}

export const TabEProposal: React.FC<TabEProposalProps> = ({ eventId }) => {
  const { data: proposalData, isLoading: isLoadingProposal, refetch } = useGetEProposalByEventIdQuery(eventId);
  const [createProposal, { isLoading: isCreating }] = useCreateEProposalMutation();
  const [updateProposal, { isLoading: isUpdating }] = useUpdateEProposalMutation();
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // TOC state
  const [tocEntries, setTocEntries] = useState<EProposalDaftarIsi[]>([]);
  const [tocDialogOpen, setTocDialogOpen] = useState(false);
  const [editingToc, setEditingToc] = useState<EProposalDaftarIsi | null>(null);
  const [tocForm, setTocForm] = useState({ judul: '', halaman: 1 });

  const proposal = proposalData?.data;

  const form = useForm({
    defaultValues: {
      judul: '',
      slug: '',
      deskripsi: '',
      auto_flip: false,
      sound_effect: true,
      bg_music_url: '',
      theme_color: '#ffffff',
      animasi_transisi: 'flip',
    },
  });

  useEffect(() => {
    if (proposal) {
      form.reset({
        judul: proposal.judul,
        slug: proposal.slug,
        deskripsi: proposal.deskripsi || '',
        auto_flip: proposal.pengaturan?.auto_flip ?? false,
        sound_effect: proposal.pengaturan?.sound_effect ?? true,
        bg_music_url: proposal.pengaturan?.bg_music_url || '',
        theme_color: proposal.pengaturan?.theme_color || '#ffffff',
        animasi_transisi: proposal.pengaturan?.animasi_transisi || 'flip',
      });
      // Load existing TOC entries
      if (proposal.daftar_isi?.length) {
        setTocEntries([...proposal.daftar_isi].sort((a, b) => a.urutan - b.urutan));
      }
    } else {
      form.setValue('slug', `event-${eventId}-proposal`);
    }
  }, [proposal, form, eventId]);

  const onSubmit = async (data: any) => {
    try {
      let file_pdf_url = proposal?.file_pdf_url || '';
      let cover_url = proposal?.cover_url || '';

      // Upload PDF if new file selected
      if (pdfFile) {
        const res = await uploadFile({ bucketName: S3_BUCKETS.E_PROPOSAL, file: pdfFile }).unwrap();
        if (res.success === false) throw res;
        // Assuming API returns object with file details
        file_pdf_url = res.data?.file?.urlPublik || res.data?.url || res.data?.fileUrl || (typeof res.data === 'string' ? res.data : ''); 
      }

      // Upload Cover if new file selected
      if (coverFile) {
        const res = await uploadFile({ bucketName: S3_BUCKETS.E_PROPOSAL, file: coverFile }).unwrap();
        if (res.success === false) throw res;
        cover_url = res.data?.file?.urlPublik || res.data?.url || res.data?.fileUrl || (typeof res.data === 'string' ? res.data : '');
      }

      if (!file_pdf_url) {
        toast.error('File PDF Proposal wajib diunggah!');
        return;
      }

      const payload = {
        event_id: eventId,
        judul: data.judul,
        slug: data.slug,
        deskripsi: data.deskripsi,
        file_pdf_url,
        cover_url,
        pengaturan: {
          auto_flip: data.auto_flip,
          sound_effect: data.sound_effect,
          bg_music_url: data.bg_music_url,
          theme_color: data.theme_color,
          animasi_transisi: data.animasi_transisi,
        },
        daftar_isi: tocEntries.map(({ judul, halaman, urutan }) => ({ judul, halaman, urutan })),
      };

      if (proposal) {
        await updateProposal({ id: proposal.id, ...payload }).unwrap();
        toast.success('E-Proposal berhasil diperbarui');
      } else {
        await createProposal(payload).unwrap();
        toast.success('E-Proposal berhasil dibuat');
      }
      refetch();
    } catch (err: any) {
      console.error(err);
      const errorMessage =
        err?.data?.message || err?.message || (typeof err === 'string' ? err : 'Terjadi kesalahan saat upload atau menyimpan');
      toast.error(errorMessage);
    }
  };

  const isSaving = isCreating || isUpdating || isUploading;

  /* ── TOC helpers ── */
  const openAddToc = () => {
    setEditingToc(null);
    setTocForm({ judul: '', halaman: 1 });
    setTocDialogOpen(true);
  };

  const openEditToc = (entry: EProposalDaftarIsi) => {
    setEditingToc(entry);
    setTocForm({ judul: entry.judul, halaman: entry.halaman });
    setTocDialogOpen(true);
  };

  const saveTocEntry = () => {
    if (!tocForm.judul.trim()) { toast.error('Judul tidak boleh kosong'); return; }
    if (tocForm.halaman < 1) { toast.error('Halaman harus minimal 1'); return; }

    if (editingToc) {
      setTocEntries(prev => prev.map(e =>
        e === editingToc ? { ...e, judul: tocForm.judul, halaman: tocForm.halaman } : e
      ));
    } else {
      const maxUrutan = tocEntries.length > 0 ? Math.max(...tocEntries.map(e => e.urutan)) : 0;
      setTocEntries(prev => [...prev, { judul: tocForm.judul, halaman: tocForm.halaman, urutan: maxUrutan + 1 }]);
    }
    setTocDialogOpen(false);
  };

  const deleteTocEntry = (entry: EProposalDaftarIsi) => {
    setTocEntries(prev => prev.filter(e => e !== entry));
  };

  const moveTocEntry = (index: number, direction: 'up' | 'down') => {
    const newEntries = [...tocEntries];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newEntries.length) return;
    // Swap urutan values
    const tempUrutan = newEntries[index].urutan;
    newEntries[index] = { ...newEntries[index], urutan: newEntries[swapIdx].urutan };
    newEntries[swapIdx] = { ...newEntries[swapIdx], urutan: tempUrutan };
    // Swap positions
    [newEntries[index], newEntries[swapIdx]] = [newEntries[swapIdx], newEntries[index]];
    setTocEntries(newEntries);
  };

  if (isLoadingProposal) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Memuat data E-Proposal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Manajemen E-Proposal / Flipbook</CardTitle>
              <CardDescription>Unggah dan atur tampilan presentasi interaktif proposal Anda.</CardDescription>
            </div>
            {proposal && (
              <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <a href={`/proposal/${proposal.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Lihat Flipbook
                </a>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* KOLOM KIRI: INFO UTAMA */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-2">Informasi Umum</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="judul">Judul Proposal <span className="text-red-500">*</span></Label>
                  <Input id="judul" {...form.register('judul', { required: true })} placeholder="Proposal Sponsorship..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Custom URL Slug <span className="text-red-500">*</span></Label>
                  <Input id="slug" {...form.register('slug', { required: true })} placeholder="event-keren-2026" />
                  <p className="text-xs text-muted-foreground">Proposal dapat diakses melalui: /proposal/<b>{form.watch('slug') || '...'}</b></p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deskripsi">Deskripsi Singkat (SEO)</Label>
                  <Textarea id="deskripsi" {...form.register('deskripsi')} placeholder="Deskripsi untuk dibagikan di sosial media..." rows={3} />
                </div>

                <div className="space-y-2 pt-2 border-t mt-4">
                  <Label>File PDF Proposal {proposal?.file_pdf_url ? '(Telah diunggah)' : <span className="text-red-500">*</span>}</Label>
                  <Input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                  {proposal?.file_pdf_url && !pdfFile && (
                    <p className="text-xs text-green-600 mt-1">✓ PDF aktif saat ini: {proposal.file_pdf_url.split('/').pop()}</p>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <Label>Gambar Sampul/Cover (Opsional)</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                </div>
              </div>

              {/* KOLOM KANAN: PENGATURAN FLIPBOOK */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b pb-2">Pengaturan Flipbook</h3>
                
                <div className="flex items-center justify-between p-3 border rounded-lg bg-stone-50/50 dark:bg-stone-900/50">
                  <div className="space-y-0.5">
                    <Label className="text-base">Efek Suara (Halaman Beralih)</Label>
                    <p className="text-xs text-muted-foreground">Memutar suara ketika membalik halaman.</p>
                  </div>
                  <input 
                    type="checkbox"
                    className="w-5 h-5 accent-primary cursor-pointer"
                    checked={form.watch('sound_effect')}
                    onChange={(e) => form.setValue('sound_effect', e.target.checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-stone-50/50 dark:bg-stone-900/50">
                  <div className="space-y-0.5">
                    <Label className="text-base">Auto Flip</Label>
                    <p className="text-xs text-muted-foreground">Berpindah halaman otomatis setiap beberapa detik.</p>
                  </div>
                  <input 
                    type="checkbox"
                    className="w-5 h-5 accent-primary cursor-pointer"
                    checked={form.watch('auto_flip')}
                    onChange={(e) => form.setValue('auto_flip', e.target.checked)}
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <Label htmlFor="bg_music_url">Background Music URL (Opsional)</Label>
                  <Input id="bg_music_url" {...form.register('bg_music_url')} placeholder="https://.../audio.mp3" />
                  <p className="text-xs text-muted-foreground">Tautan ke file MP3 yang akan diputar pelan sebagai latar belakang.</p>
                </div>

                <div className="space-y-2 pt-2 hidden">
                    <Label>Warna Tema</Label>
                    <Input type="color" {...form.register('theme_color')} className="w-24 h-10 p-1" />
                </div>
              </div>

            </div>

            {/* ── DAFTAR ISI / TABLE OF CONTENTS ── */}
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Daftar Isi</h3>
                  <Badge variant="secondary" className="text-xs">{tocEntries.length} item</Badge>
                </div>
                <Dialog open={tocDialogOpen} onOpenChange={setTocDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm" onClick={openAddToc}>
                      <Plus className="w-4 h-4 mr-1" />
                      Tambah
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingToc ? 'Edit Daftar Isi' : 'Tambah Daftar Isi'}</DialogTitle>
                      <DialogDescription>Tentukan judul bab/bagian dan nomor halaman di PDF.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="toc-judul">Judul Bab/Bagian</Label>
                        <Input
                          id="toc-judul"
                          value={tocForm.judul}
                          onChange={(e) => setTocForm(prev => ({ ...prev, judul: e.target.value }))}
                          placeholder="Bab 1 - Pendahuluan"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="toc-halaman">Nomor Halaman</Label>
                        <Input
                          id="toc-halaman"
                          type="number"
                          min={1}
                          value={tocForm.halaman}
                          onChange={(e) => setTocForm(prev => ({ ...prev, halaman: parseInt(e.target.value) || 1 }))}
                        />
                        <p className="text-xs text-muted-foreground">Halaman sesuai nomor halaman di file PDF (dimulai dari 1).</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setTocDialogOpen(false)}>Batal</Button>
                      <Button type="button" onClick={saveTocEntry}>
                        {editingToc ? 'Simpan' : 'Tambah'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {tocEntries.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead>Judul</TableHead>
                        <TableHead className="w-24 text-center">Halaman</TableHead>
                        <TableHead className="w-32 text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tocEntries.map((entry, idx) => (
                        <TableRow key={`${entry.urutan}-${entry.judul}`}>
                          <TableCell className="text-center text-muted-foreground text-sm">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{entry.judul}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{entry.halaman}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={idx === 0}
                                onClick={() => moveTocEntry(idx, 'up')}
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={idx === tocEntries.length - 1}
                                onClick={() => moveTocEntry(idx, 'down')}
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-primary"
                                onClick={() => openEditToc(entry)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => deleteTocEntry(entry)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center">
                  <ListOrdered className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Belum ada daftar isi.</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Tambahkan bab atau bagian untuk navigasi cepat di flipbook.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t mt-6">
              <Button type="submit" disabled={isSaving} className="min-w-[150px] shadow-primary/30 shadow-lg hover:shadow-primary/50 transition-all">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {proposal ? 'Simpan Perubahan' : 'Buat Proposal'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
