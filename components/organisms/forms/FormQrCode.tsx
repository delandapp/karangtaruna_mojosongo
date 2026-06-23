"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { HexColorPicker } from "react-colorful";
import {
  Save,
  Link2,
  FileText,
  Mail,
  Phone,
  Wifi,
  User,
  Download,
  Info,
  ChevronLeft,
  Palette,
  LayoutGrid,
  Image as ImageIcon,
  Sliders,
  Sparkles,
  QrCode as QrIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { schemaCreateQrCode } from "@/lib/validations/qrcode.schema";
import { useCreateQrCodeMutation, useUpdateQrCodeMutation, QrCode } from "@/features/api/qrCodeApi";

interface FormQrCodeProps {
  initialData?: QrCode | null;
}

export function FormQrCode({ initialData }: FormQrCodeProps) {
  const router = useRouter();
  const [createQrCode, { isLoading: isCreating }] = useCreateQrCodeMutation();
  const [updateQrCode, { isLoading: isUpdating }] = useUpdateQrCodeMutation();
  const isLoading = isCreating || isUpdating;

  // ── Form State ─────────────────────────────────────────────────────────────
  const [judul, setJudul] = useState("");
  const [tipeKonten, setTipeKonten] = useState<"url" | "teks" | "email" | "telepon" | "wifi" | "vcard">("url");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Content Fields
  const [url, setUrl] = useState("");
  const [teks, setTeks] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [telNo, setTelNo] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiSecurity, setWifiSecurity] = useState("WPA");
  const [vcardName, setVcardName] = useState("");
  const [vcardOrg, setVcardOrg] = useState("");
  const [vcardPhone, setVcardPhone] = useState("");
  const [vcardEmail, setVcardEmail] = useState("");

  // Styling QR
  const [warnaDepan, setWarnaDepan] = useState("#000000");
  const [warnaBelakang, setWarnaBelakang] = useState("#FFFFFF");
  const [gayaTitik, setGayaTitik] = useState("square");
  const [gayaSudutLuar, setGayaSudutLuar] = useState("square");
  const [gayaSudutDalam, setGayaSudutDalam] = useState("square");
  const [warnaSudutLuar, setWarnaSudutLuar] = useState("");
  const [warnaSudutDalam, setWarnaSudutDalam] = useState("");

  // Logo tengah
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUkuran, setLogoUkuran] = useState(20);
  const [logoMargin, setLogoMargin] = useState(5);
  const [logoHapusBg, setLogoHapusBg] = useState(true);

  // Ukuran & Opsi
  const [ukuran, setUkuran] = useState(300);
  const [margin, setMargin] = useState(10);
  const [levelKoreksi, setLevelKoreksi] = useState("M");

  // ── Sync Initial Data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (initialData) {
      setJudul(initialData.judul);
      setTipeKonten(initialData.tipe_konten as any);
      setWarnaDepan(initialData.warna_depan);
      setWarnaBelakang(initialData.warna_belakang);
      setGayaTitik(initialData.gaya_titik);
      setGayaSudutLuar(initialData.gaya_sudut_luar);
      setGayaSudutDalam(initialData.gaya_sudut_dalam);
      setWarnaSudutLuar(initialData.warna_sudut_luar || "");
      setWarnaSudutDalam(initialData.warna_sudut_dalam || "");
      setLogoUrl(initialData.logo_url || "");
      setLogoUkuran(initialData.logo_ukuran);
      setLogoMargin(initialData.logo_margin);
      setLogoHapusBg(initialData.logo_hapus_bg);
      setUkuran(initialData.ukuran);
      setMargin(initialData.margin);
      setLevelKoreksi(initialData.level_koreksi);

      // Parse content based on type
      const content = initialData.konten;
      if (initialData.tipe_konten === "url") {
        setUrl(content);
      } else if (initialData.tipe_konten === "teks") {
        setTeks(content);
      } else if (initialData.tipe_konten === "email") {
        if (content.startsWith("mailto:")) {
          const u = new URL(content);
          setEmailAddress(u.pathname);
          setEmailSubject(u.searchParams.get("subject") || "");
          setEmailBody(u.searchParams.get("body") || "");
        } else {
          setEmailAddress(content);
        }
      } else if (initialData.tipe_konten === "telepon") {
        setTelNo(content.replace("tel:", ""));
      } else if (initialData.tipe_konten === "wifi") {
        // format: WIFI:S:SSID;T:WPA;P:PASSWORD;;
        const matchS = content.match(/S:([^;]+);/);
        const matchT = content.match(/T:([^;]+);/);
        const matchP = content.match(/P:([^;]+);/);
        if (matchS) setWifiSsid(matchS[1]);
        if (matchT) setWifiSecurity(matchT[1]);
        if (matchP) setWifiPassword(matchP[1]);
      } else if (initialData.tipe_konten === "vcard") {
        // parse vcard lines
        const lines = content.split("\n");
        lines.forEach((line) => {
          if (line.startsWith("FN:")) setVcardName(line.substring(3).trim());
          if (line.startsWith("ORG:")) setVcardOrg(line.substring(4).trim());
          if (line.startsWith("TEL:")) setVcardPhone(line.substring(4).trim());
          if (line.startsWith("EMAIL:")) setVcardEmail(line.substring(6).trim());
        });
      }
    }
  }, [initialData]);

  // ── Helper to assemble QR code content string ──────────────────────────────
  const getCompiledContent = (): string => {
    switch (tipeKonten) {
      case "url":
        return url.trim();
      case "teks":
        return teks;
      case "email":
        if (!emailAddress) return "";
        const sp = new URLSearchParams();
        if (emailSubject) sp.set("subject", emailSubject);
        if (emailBody) sp.set("body", emailBody);
        const query = sp.toString() ? `?${sp.toString()}` : "";
        return `mailto:${emailAddress}${query}`;
      case "telepon":
        return telNo ? `tel:${telNo}` : "";
      case "wifi":
        if (!wifiSsid) return "";
        return `WIFI:S:${wifiSsid};T:${wifiSecurity};P:${wifiPassword};;`;
      case "vcard":
        if (!vcardName) return "";
        return [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `FN:${vcardName}`,
          vcardOrg ? `ORG:${vcardOrg}` : "",
          vcardPhone ? `TEL:${vcardPhone}` : "",
          vcardEmail ? `EMAIL:${vcardEmail}` : "",
          "END:VCARD",
        ]
          .filter(Boolean)
          .join("\n");
      default:
        return "";
    }
  };

  const compiledContent = getCompiledContent();

  // ── Handle Logo File Upload ────────────────────────────────────────────────
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg", "image/svg+xml"].includes(file.type)) {
      toast.error("Format file tidak didukung. Gunakan PNG, JPG, atau SVG.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimal 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ── Handle Submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const payload = {
      judul,
      konten: compiledContent,
      tipe_konten: tipeKonten,
      warna_depan: warnaDepan,
      warna_belakang: warnaBelakang,
      gaya_titik: gayaTitik,
      gaya_sudut_luar: gayaSudutLuar,
      gaya_sudut_dalam: gayaSudutDalam,
      warna_sudut_luar: warnaSudutLuar || undefined,
      warna_sudut_dalam: warnaSudutDalam || undefined,
      logo_url: logoUrl || undefined,
      logo_ukuran: logoUkuran,
      logo_margin: logoMargin,
      logo_hapus_bg: logoHapusBg,
      ukuran: ukuran,
      margin: margin,
      level_koreksi: levelKoreksi,
    };

    // Client-side Zod validation
    const validation = schemaCreateQrCode.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      toast.error("Validasi gagal", {
        description: validation.error.issues[0].message,
      });
      return;
    }

    try {
      if (initialData) {
        await updateQrCode({ id: initialData.id, ...payload }).unwrap();
        toast.success("QR Code berhasil diperbarui");
      } else {
        await createQrCode(payload).unwrap();
        toast.success("QR Code berhasil disimpan");
      }
      router.push("/dashboard/qr-code");
    } catch (err: any) {
      toast.error(err?.data?.message || "Gagal menyimpan QR Code");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
      {/* Kolom Kiri: Panel Kustomisasi (60%) */}
      <div className="w-full lg:w-[60%] flex flex-col gap-6">
        <Card className="border-border/50 bg-card/60 backdrop-blur shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="size-5 text-primary" /> Pengaturan Desain QR
            </CardTitle>
            <CardDescription>
              Kustomisasi isi konten dan estetika visual QR Code Anda.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="p-0">
              <Tabs defaultValue="konten" className="w-full">
                <TabsList className="flex w-full justify-start rounded-none border-b border-border bg-transparent p-0 overflow-x-auto">
                  <TabsTrigger value="konten" className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground bg-transparent shrink-0">
                    <Link2 className="size-4" /> Konten
                  </TabsTrigger>
                  <TabsTrigger value="titik" className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground bg-transparent shrink-0">
                    <Sparkles className="size-4" /> Warna & Gaya
                  </TabsTrigger>
                  <TabsTrigger value="logo" className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground bg-transparent shrink-0">
                    <ImageIcon className="size-4" /> Logo Tengah
                  </TabsTrigger>
                  <TabsTrigger value="opsi" className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground bg-transparent shrink-0">
                    <Sliders className="size-4" /> Opsi Ukuran
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: KONTEN */}
                <TabsContent value="konten" className="p-6 space-y-5 outline-none">
                  {/* Judul QR Code */}
                  <div className="space-y-2">
                    <Label htmlFor="judul" className="font-semibold text-foreground">
                      Judul QR Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="judul"
                      placeholder="Contoh: QR Flyer Rapat RT 04"
                      value={judul}
                      onChange={(e) => setJudul(e.target.value)}
                      className={`bg-muted/30 focus-visible:ring-primary/40 ${errors.judul ? "border-red-500" : ""}`}
                    />
                    {errors.judul && <p className="text-xs text-red-500 font-medium">{errors.judul}</p>}
                  </div>

                  {/* Tipe Konten Selector */}
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Tipe Informasi</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { id: "url", label: "Link/URL", icon: Link2 },
                        { id: "teks", label: "Teks", icon: FileText },
                        { id: "email", label: "Email", icon: Mail },
                        { id: "telepon", label: "Telp", icon: Phone },
                        { id: "wifi", label: "WiFi", icon: Wifi },
                        { id: "vcard", label: "vCard", icon: User },
                      ].map((item) => {
                        const IconComp = item.icon;
                        const active = tipeKonten === item.id;
                        return (
                          <Button
                            key={item.id}
                            type="button"
                            variant={active ? "default" : "outline"}
                            className="flex flex-col items-center justify-center h-16 py-2 px-1 text-xs gap-1"
                            onClick={() => setTipeKonten(item.id as any)}
                          >
                            <IconComp className="size-4 shrink-0" />
                            <span className="truncate w-full text-center">{item.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dynamic Inputs based on Tipe Konten */}
                  <div className="pt-4 border-t border-border/40 space-y-4">
                    {/* URL Input */}
                    {tipeKonten === "url" && (
                      <div className="space-y-2">
                        <Label htmlFor="url" className="font-semibold">URL Website</Label>
                        <Input
                          id="url"
                          type="url"
                          placeholder="https://karangtarunamoso.org/pendaftaran"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="bg-muted/30 focus-visible:ring-primary/40"
                        />
                        <p className="text-[11px] text-muted-foreground">Wajib menyertakan http:// atau https://</p>
                      </div>
                    )}

                    {/* Teks Input */}
                    {tipeKonten === "teks" && (
                      <div className="space-y-2">
                        <Label htmlFor="teks" className="font-semibold">Teks Bebas</Label>
                        <Textarea
                          id="teks"
                          placeholder="Masukkan teks atau catatan di sini..."
                          value={teks}
                          onChange={(e) => setTeks(e.target.value)}
                          className="bg-muted/30 focus-visible:ring-primary/40 min-h-[100px]"
                        />
                      </div>
                    )}

                    {/* Email Input */}
                    {tipeKonten === "email" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="font-semibold">Alamat Penerima Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="admin@karangtaruna.org"
                            value={emailAddress}
                            onChange={(e) => setEmailAddress(e.target.value)}
                            className="bg-muted/30 focus-visible:ring-primary/40"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject" className="font-semibold">Subjek (Opsional)</Label>
                          <Input
                            id="subject"
                            placeholder="Tanya info kepengurusan"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            className="bg-muted/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="body" className="font-semibold">Isi Pesan (Opsional)</Label>
                          <Textarea
                            id="body"
                            placeholder="Halo admin..."
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            className="bg-muted/30 min-h-[80px]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Telepon Input */}
                    {tipeKonten === "telepon" && (
                      <div className="space-y-2">
                        <Label htmlFor="tel" className="font-semibold">Nomor Telepon</Label>
                        <Input
                          id="tel"
                          type="tel"
                          placeholder="Contoh: 08123456789"
                          value={telNo}
                          onChange={(e) => setTelNo(e.target.value)}
                          className="bg-muted/30"
                        />
                      </div>
                    )}

                    {/* WiFi Input */}
                    {tipeKonten === "wifi" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="ssid" className="font-semibold">Nama Network (SSID)</Label>
                          <Input
                            id="ssid"
                            placeholder="Contoh: WiFi Karang Taruna"
                            value={wifiSsid}
                            onChange={(e) => setWifiSsid(e.target.value)}
                            className="bg-muted/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="wifipass" className="font-semibold">Password WiFi</Label>
                          <Input
                            id="wifipass"
                            type="password"
                            placeholder="Password jaringan"
                            value={wifiPassword}
                            onChange={(e) => setWifiPassword(e.target.value)}
                            className="bg-muted/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-semibold">Tipe Enkripsi</Label>
                          <Select value={wifiSecurity} onValueChange={setWifiSecurity}>
                            <SelectTrigger className="bg-muted/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="WPA">WPA/WPA2</SelectItem>
                              <SelectItem value="WEP">WEP</SelectItem>
                              <SelectItem value="nopass">Tanpa Sandi (Terbuka)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* vCard Input */}
                    {tipeKonten === "vcard" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vcname" className="font-semibold">Nama Lengkap</Label>
                          <Input id="vcname" placeholder="Budi Santoso" value={vcardName} onChange={(e) => setVcardName(e.target.value)} className="bg-muted/30" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vcorg" className="font-semibold">Organisasi / Lembaga</Label>
                          <Input id="vcorg" placeholder="Karang Taruna Mojosongo" value={vcardOrg} onChange={(e) => setVcardOrg(e.target.value)} className="bg-muted/30" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vctel" className="font-semibold">No HP / Telp</Label>
                          <Input id="vctel" placeholder="0812xxxx" value={vcardPhone} onChange={(e) => setVcardPhone(e.target.value)} className="bg-muted/30" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vcmail" className="font-semibold">Alamat Email</Label>
                          <Input id="vcmail" type="email" placeholder="budi@domain.com" value={vcardEmail} onChange={(e) => setVcardEmail(e.target.value)} className="bg-muted/30" />
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* TAB 2: WARNA & GAYA */}
                <TabsContent value="titik" className="p-6 space-y-6 outline-none">
                  {/* Colors Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2 flex flex-col">
                      <Label className="font-semibold">Warna Depan (QR)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start gap-2 bg-muted/20 border-border/60">
                            <span className="size-4 rounded-full border border-border shadow-xs" style={{ backgroundColor: warnaDepan }} />
                            <span>{warnaDepan}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-fit p-3 bg-card border-border/80">
                          <HexColorPicker color={warnaDepan} onChange={setWarnaDepan} />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2 flex flex-col">
                      <Label className="font-semibold">Warna Latar Belakang</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start gap-2 bg-muted/20 border-border/60">
                            <span className="size-4 rounded-full border border-border shadow-xs" style={{ backgroundColor: warnaBelakang }} />
                            <span>{warnaBelakang}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-fit p-3 bg-card border-border/80">
                          <HexColorPicker color={warnaBelakang} onChange={setWarnaBelakang} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Shapes Selection */}
                  <div className="space-y-4 pt-4 border-t border-border/40">
                    <div className="space-y-2">
                      <Label className="font-semibold">Gaya Gambar QR Code (Preview hanya support standar)</Label>
                      <Select value={gayaTitik} onValueChange={setGayaTitik}>
                        <SelectTrigger className="bg-muted/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="square">Kotak Klasik (Square)</SelectItem>
                          <SelectItem value="rounded">Sudut Membulat (Rounded)</SelectItem>
                          <SelectItem value="dots">Lingkaran Kecil (Dots)</SelectItem>
                          <SelectItem value="classy">Classy Modern</SelectItem>
                          <SelectItem value="classy-rounded">Classy Rounded</SelectItem>
                          <SelectItem value="extra-rounded">Ekstra Membulat</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">
                        Catatan: Gaya visual kustomisasi titik dan sudut ini akan diproses penuh pada hasil unduhan server-side kualitas tinggi.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 3: LOGO TENGAH */}
                <TabsContent value="logo" className="p-6 space-y-6 outline-none">
                  {/* File Upload Selector */}
                  <div className="space-y-3">
                    <Label className="font-semibold">Unggah Logo Tengah</Label>
                    <div className="flex items-center gap-4">
                      {logoUrl ? (
                        <div className="relative size-16 rounded-xl border border-border overflow-hidden bg-muted flex items-center justify-center p-1.5 shrink-0">
                          <img src={logoUrl} alt="Logo preview" className="object-contain size-full" />
                        </div>
                      ) : (
                        <div className="size-16 rounded-xl border border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20 text-muted-foreground shrink-0">
                          <ImageIcon className="size-6" />
                        </div>
                      )}

                      <div className="flex flex-col gap-2">
                        <Input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                          onChange={handleLogoUpload}
                          className="max-w-xs cursor-pointer text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground">Mendukung format PNG, JPG, SVG. Maksimal 2MB.</p>
                      </div>
                    </div>
                  </div>

                  {logoUrl && (
                    <div className="space-y-4 pt-4 border-t border-border/40">
                      {/* Logo Size */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <Label>Ukuran Logo ({logoUkuran}%)</Label>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="35"
                          value={logoUkuran}
                          onChange={(e) => setLogoUkuran(Number(e.target.value))}
                          className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      {/* Logo Margin */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <Label>Margin Logo ({logoMargin}px)</Label>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={logoMargin}
                          onChange={(e) => setLogoMargin(Number(e.target.value))}
                          className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      {/* Background removal toggle */}
                      <div className="flex items-center justify-between bg-muted/20 border border-border/40 p-3 rounded-lg">
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-foreground">Hapus Latar Belakang di Belakang Logo</p>
                          <p className="text-[10px] text-muted-foreground">Mengosongkan area di belakang logo agar tetap terbaca.</p>
                        </div>
                        <Switch checked={logoHapusBg} onCheckedChange={setLogoHapusBg} />
                      </div>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setLogoUrl("")}
                        className="mt-2"
                      >
                        Hapus Logo
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* TAB 4: OPTIONS */}
                <TabsContent value="opsi" className="p-6 space-y-6 outline-none">
                  {/* Size setting */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <Label>Resolusi Ukuran Unduhan ({ukuran}px)</Label>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="2000"
                      step="50"
                      value={ukuran}
                      onChange={(e) => setUkuran(Number(e.target.value))}
                      className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <p className="text-[10px] text-muted-foreground">Menentukan lebar piksel gambar PNG saat diunduh.</p>
                  </div>

                  {/* Margin setting */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <Label>Margin Luar QR ({margin}px)</Label>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={margin}
                      onChange={(e) => setMargin(Number(e.target.value))}
                      className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Level Correction */}
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <Label className="font-semibold">Error Correction Level</Label>
                    <Select value={levelKoreksi} onValueChange={setLevelKoreksi}>
                      <SelectTrigger className="bg-muted/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">L (Koreksi Ringan - 7%)</SelectItem>
                        <SelectItem value="M">M (Koreksi Sedang - 15%)</SelectItem>
                        <SelectItem value="Q">Q (Koreksi Kuat - 25%)</SelectItem>
                        <SelectItem value="H">H (Koreksi Maksimal - 30%)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 text-zinc-500">
                      <Info className="size-3 text-primary shrink-0" /> Gunakan tingkat &quot;H&quot; jika menaruh logo besar di tengah QR.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>

            <CardFooter className="flex justify-end gap-3 pt-6 border-t border-border/50 p-6 bg-muted/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/qr-code")}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading} className="gap-2 shadow-md shadow-primary/10">
                {isLoading ? (
                  "Menyimpan..."
                ) : (
                  <>
                    <Save className="size-4" /> Simpan QR Code
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Kolom Kanan: Real-time Live Preview (40%) */}
      <div className="w-full lg:w-[40%] lg:sticky lg:top-6 flex flex-col gap-6">
        <Card className="border-border/50 bg-card/65 backdrop-blur shadow-sm p-6 flex flex-col items-center">
          <CardHeader className="p-0 text-center w-full pb-4 border-b border-border/40">
            <CardTitle className="text-base flex items-center justify-center gap-1.5">
              <QrIcon className="size-5 text-primary" /> Live Preview
            </CardTitle>
            <CardDescription className="text-xs">Preview visual QR Code secara langsung</CardDescription>
          </CardHeader>

          {/* QR Drawing Display Box */}
          <div className="my-8 p-6 bg-white rounded-2xl shadow-sm border border-zinc-200 flex items-center justify-center select-none">
            {compiledContent ? (
              <QRCodeSVG
                value={compiledContent}
                size={200}
                fgColor={warnaDepan}
                bgColor={warnaBelakang}
                level={levelKoreksi as any}
                imageSettings={
                  logoUrl
                    ? {
                        src: logoUrl,
                        x: undefined,
                        y: undefined,
                        height: (logoUkuran / 100) * 200,
                        width: (logoUkuran / 100) * 200,
                        excavate: logoHapusBg,
                      }
                    : undefined
                }
              />
            ) : (
              <div className="size-[200px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-zinc-300 rounded-xl bg-zinc-50">
                <QrIcon className="size-12 text-zinc-350 stroke-1 mb-2 animate-bounce" />
                <p className="text-xs font-semibold text-zinc-500">Konten Masih Kosong</p>
                <p className="text-[10px] text-zinc-400 mt-1">Masukkan teks atau alamat URL pada tab Konten di samping.</p>
              </div>
            )}
          </div>

          {/* Metadata content summary */}
          <div className="w-full bg-muted/40 p-4 border border-border/60 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Judul:</span>
              <span className="text-foreground font-bold truncate max-w-[200px]">{judul || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Format Tipe:</span>
              <span className="text-foreground font-bold capitalize">{tipeKonten}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-medium">Isi QR Code:</span>
              <span className="text-foreground font-mono font-bold truncate max-w-[170px]" title={compiledContent}>
                {compiledContent || "-"}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
