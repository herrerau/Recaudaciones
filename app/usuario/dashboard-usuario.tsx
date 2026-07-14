"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { DatosCompletos } from "@/lib/metabase";
import type { PanelesConfig, PanelUsuario } from "@/lib/paneles";

function formatNumber(value: number | undefined | null): string {
  return Number(value || 0).toLocaleString("es-VE", {
    maximumFractionDigits: 2,
  });
}

export default function DashboardUsuario() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("user") || "general";

  const [datos, setDatos] = useState<DatosCompletos | null>(null);
  const [perfil, setPerfil] = useState<PanelUsuario | null>(null);
  const [estado, setEstado] = useState<"cargando" | "conectado" | "error">(
    "cargando"
  );

  useEffect(() => {
    let activo = true;

    async function cargarDatos() {
      try {
        const [datosRes, configRes] = await Promise.all([
          fetch("/api/datos"),
          fetch("/api/admin/config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }),
        ]);
        const datosJson: DatosCompletos = await datosRes.json();
        const config: PanelesConfig = await configRes.json();

        if (!activo) return;
        setDatos(datosJson);
        setPerfil(config.usuarios?.[userId] ?? null);
        setEstado("conectado");
      } catch (error) {
        console.error(error);
        if (activo) setEstado("error");
      }
    }

    cargarDatos();
    return () => {
      activo = false;
    };
  }, [userId]);

  const titulo = perfil?.nombre_usuario || `Pantalla ${userId}`;
  const resumen = perfil
    ? `Regiones permitidas: ${perfil.regiones_permitidas?.join(", ") || "Todas"}`
    : "Vista general del panel fiscal";

  const recaudacion = datos?.recaudacion;
  const regiones = (datos?.regiones ?? []).slice(0, 8);

  return (
    <div className="dashboard">
      <header>
        <div>
          <h1>
            <i className="fas fa-landmark"></i> <span>{titulo}</span>
          </h1>
          <div className="sub">
            {estado === "cargando" ? "Cargando datos del sistema..." : resumen}
          </div>
        </div>
        <div className="badge">
          <span className="status"></span> Metabase API{" "}
          <span>
            {estado === "conectado"
              ? "Conectado"
              : estado === "error"
                ? "Sin conexión"
                : "Conectando..."}
          </span>
        </div>
      </header>

      <section className="hero">
        <p>
          Vista personalizada para la pantalla seleccionada, con datos en
          tiempo real y accesos por región.
        </p>
      </section>

      <section id="cards" className="grid">
        {estado === "error" ? (
          <div className="card">
            <h3>Error</h3>
            <div className="muted">No se pudieron cargar los datos.</div>
          </div>
        ) : (
          <>
            <article className="card">
              <h3>Recaudación</h3>
              <div className="value">
                Bs. {formatNumber(recaudacion?.total_bs)}
              </div>
              <div className="muted">
                USD {formatNumber(recaudacion?.total_usd)}
              </div>
            </article>
            <article className="card">
              <h3>Pagos sin conciliar</h3>
              <div className="value">
                {formatNumber(recaudacion?.pagos_sin_conciliar)}
              </div>
              <div className="muted">
                Ayer: {formatNumber(recaudacion?.pagos_sin_conciliar_ayer)}
              </div>
            </article>
            <article className="card">
              <h3>Pagos conciliados</h3>
              <div className="value">
                {formatNumber(recaudacion?.pagos_conciliados)}
              </div>
              <div className="muted">
                Recaudación ayer: Bs.{" "}
                {formatNumber(datos?.ayer?.recaudacion?.total_bs)}
              </div>
            </article>
          </>
        )}
      </section>

      <section className="table-card">
        <h3>Principales regiones</h3>
        <table>
          <thead>
            <tr>
              <th>Región</th>
              <th>Recaudación</th>
              <th>Tendencia</th>
            </tr>
          </thead>
          <tbody>
            {regiones.map((item) => (
              <tr key={item.region}>
                <td>{item.region || "Sin región"}</td>
                <td>Bs. {formatNumber(item.total)}</td>
                <td>
                  <span className="tag">0%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
