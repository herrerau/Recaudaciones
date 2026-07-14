"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { PanelesConfig } from "@/lib/paneles";

const REGIONES = [
  { value: "REGION CAPITAL", label: "Capital" },
  { value: "REGION CENTRAL", label: "Central" },
  { value: "REGION LOS ANDES", label: "Los Andes" },
  { value: "REGION ZULIANA", label: "Zuliana" },
  { value: "REGION GUAYANA", label: "Guayana" },
  { value: "REGIÓN FALCÓN", label: "Falcón" },
  { value: "REGION INSULAR", label: "Insular" },
  { value: "REGION LOS LLANOS", label: "Los Llanos" },
  { value: "REGION NOR ORIENTAL", label: "Nor Oriental" },
  { value: "REGION CENTRO OCCIDENTAL", label: "Centro Occidental" },
  { value: "REGION LIBERTADOR", label: "Libertador" },
  { value: "REGION DE CONTRIBUYENTES ESPECIALES", label: "Especiales" },
];

export default function AdminPanel() {
  const [usuarios, setUsuarios] = useState<PanelesConfig["usuarios"] | null>(
    null
  );
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  const [userId, setUserId] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [mostrarRecaudacion, setMostrarRecaudacion] = useState(true);
  const [mostrarMaquinas, setMostrarMaquinas] = useState(true);
  const [mostrarDeclaraciones, setMostrarDeclaraciones] = useState(true);
  const [regionesSel, setRegionesSel] = useState<string[]>([]);

  const cargarConfiguraciones = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data: PanelesConfig = await res.json();
      setUsuarios(data.usuarios ?? {});
      setErrorCarga(null);
    } catch (error) {
      console.error(error);
      setErrorCarga(error instanceof Error ? error.message : String(error));
    }
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
    cargarConfiguraciones();
  }, [cargarConfiguraciones]);

  const toggleRegion = (value: string) => {
    setRegionesSel((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      user_id: userId.trim(),
      nombre_usuario: nombreUsuario.trim(),
      mostrar_recaudacion: mostrarRecaudacion,
      mostrar_maquinas: mostrarMaquinas,
      mostrar_declaraciones: mostrarDeclaraciones,
      regiones_permitidas: regionesSel,
    };

    try {
      const res = await fetch("/api/admin/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("✅ Pantalla guardada exitosamente");
        setUserId("");
        setNombreUsuario("");
        setMostrarRecaudacion(true);
        setMostrarMaquinas(true);
        setMostrarDeclaraciones(true);
        setRegionesSel([]);
        cargarConfiguraciones();
      } else {
        alert("❌ Error al guardar: " + (data.error || "Error desconocido"));
      }
    } catch (error) {
      alert(
        "❌ Error al guardar: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  return (
    <div className="container">
      <header>
        <div>
          <h1>
            <i className="fa-solid fa-sliders"></i> Control de Personalización
            de Pantallas
          </h1>
          <p>
            Gestiona pantallas, regiones y componentes visibles desde un solo
            lugar.
          </p>
        </div>
        <div className="badge">
          <i className="fa-solid fa-server"></i> API local activa
        </div>
      </header>

      <div className="form-grid">
        <section className="form-card">
          <form id="panelForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="userId">ID Único de la Pantalla / Usuario:</label>
              <input
                type="text"
                id="userId"
                placeholder="ej: fiscalia_andes, pantalla_central"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="nombreUsuario">
                Nombre Descriptivo de la Pantalla:
              </label>
              <input
                type="text"
                id="nombreUsuario"
                placeholder="ej: Monitor Sala Situacional Los Andes"
                required
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Componentes Visibles:</label>
              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={mostrarRecaudacion}
                    onChange={(e) => setMostrarRecaudacion(e.target.checked)}
                  />{" "}
                  Recaudación ($)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={mostrarMaquinas}
                    onChange={(e) => setMostrarMaquinas(e.target.checked)}
                  />{" "}
                  Máquinas Fiscales
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={mostrarDeclaraciones}
                    onChange={(e) => setMostrarDeclaraciones(e.target.checked)}
                  />{" "}
                  Declaraciones
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Regiones Geográficas Asignadas:</label>
              <div className="region-selector">
                {REGIONES.map((r) => (
                  <label key={r.value}>
                    <input
                      type="checkbox"
                      className="reg-check"
                      value={r.value}
                      checked={regionesSel.includes(r.value)}
                      onChange={() => toggleRegion(r.value)}
                    />{" "}
                    {r.label}
                  </label>
                ))}
              </div>
            </div>
            <button type="submit">
              <i className="fa-solid fa-floppy-disk"></i> Generar y Guardar
              Pantalla
            </button>
          </form>
        </section>

        <section className="form-card">
          <h2>Pantallas Activas y Enlaces de Transmisión</h2>
          <table id="usuariosTable">
            <thead>
              <tr>
                <th>Nombre de Pantalla</th>
                <th>ID Usuario</th>
                <th>Regiones</th>
                <th>Componentes</th>
                <th>Enlace</th>
              </tr>
            </thead>
            <tbody>
              {errorCarga ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    ⚠️ Error al cargar configuraciones: {errorCarga}
                  </td>
                </tr>
              ) : usuarios === null ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    Cargando configuraciones...
                  </td>
                </tr>
              ) : Object.keys(usuarios).length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No hay pantallas configuradas
                  </td>
                </tr>
              ) : (
                Object.entries(usuarios).map(([id, info]) => {
                  const link = `${origin}/usuario?user=${id}`;
                  const comps: string[] = [];
                  if (info.mostrar_recaudacion) comps.push("💰 Recaudación");
                  if (info.mostrar_maquinas) comps.push("🖥️ Máquinas");
                  if (info.mostrar_declaraciones) comps.push("📄 Declaraciones");

                  return (
                    <tr key={id}>
                      <td>
                        <strong>{info.nombre_usuario || id}</strong>
                      </td>
                      <td>
                        <span className="badge-info">{id}</span>
                      </td>
                      <td>
                        {(info.regiones_permitidas || []).length > 0
                          ? info.regiones_permitidas.map((r) => (
                              <span key={r} className="badge-info">
                                {r.replace("REGION ", "")}{" "}
                              </span>
                            ))
                          : "Todas"}
                      </td>
                      <td>{comps.join(" · ")}</td>
                      <td>
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="url-chip"
                        >
                          {link}
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
