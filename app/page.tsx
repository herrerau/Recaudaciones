import type { Metadata } from "next";
import AdminPanel from "./admin-panel";
import "./admin.css";

export const metadata: Metadata = {
  title: "SENIAT - Administrador de Paneles",
};

export default function AdminPage() {
  return <AdminPanel />;
}
