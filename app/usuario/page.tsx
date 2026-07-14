import type { Metadata } from "next";
import { Suspense } from "react";
import DashboardUsuario from "./dashboard-usuario";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "SENIAT · Panel Fiscal en Tiempo Real",
};

export default function UsuarioPage() {
  return (
    <Suspense fallback={null}>
      <DashboardUsuario />
    </Suspense>
  );
}
