// ============================================================
// CONFIGURACIÓN DE PANELES / PANTALLAS POR USUARIO
// Persistencia simple en paneles_usuarios.json (raíz del proyecto),
// igual que el antiguo servidor Python.
// ============================================================
import { promises as fs } from "fs";
import path from "path";

export interface PanelUsuario {
  nombre_usuario: string | null;
  regiones_permitidas: string[];
  mostrar_recaudacion: boolean;
  mostrar_maquinas: boolean;
  mostrar_declaraciones: boolean;
}

export interface PanelesConfig {
  usuarios: Record<string, PanelUsuario>;
}

const CONFIG_FILE = path.join(process.cwd(), "paneles_usuarios.json");

export async function leerConfig(): Promise<PanelesConfig> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, "utf-8");
    const config = JSON.parse(raw);
    return { usuarios: config.usuarios ?? {} };
  } catch {
    return { usuarios: {} };
  }
}

export async function guardarPanel(data: {
  user_id?: string;
  nombre_usuario?: string;
  regiones_permitidas?: string[];
  mostrar_recaudacion?: boolean;
  mostrar_maquinas?: boolean;
  mostrar_declaraciones?: boolean;
}): Promise<void> {
  const config = await leerConfig();

  config.usuarios[String(data.user_id)] = {
    nombre_usuario: data.nombre_usuario ?? null,
    regiones_permitidas: data.regiones_permitidas ?? [],
    mostrar_recaudacion: data.mostrar_recaudacion ?? true,
    mostrar_maquinas: data.mostrar_maquinas ?? true,
    mostrar_declaraciones: data.mostrar_declaraciones ?? true,
  };

  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}
