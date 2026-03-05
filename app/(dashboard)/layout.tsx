import type { Metadata } from "next";
import { DashboardLayout } from "@/components/templates/DashboardLayout";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
