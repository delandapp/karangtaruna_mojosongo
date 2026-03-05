import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
    title: "Login",
    description:
        "Masuk ke Sistem Informasi Karang Taruna Kelurahan Mojosongo, Kecamatan Jebres, Kota Surakarta.",
};

export default function LoginPage() {
    return <LoginForm />;
}
