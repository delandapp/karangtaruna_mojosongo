import type { Metadata } from "next";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
    title: "Daftar Akun",
    description:
        "Buat akun baru untuk mengakses Sistem Informasi Karang Taruna Kelurahan Mojosongo.",
};

export default function RegisterPage() {
    return <RegisterForm />;
}
