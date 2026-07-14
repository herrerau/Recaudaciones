import fs from "fs/promises";
import path from "path";
import { metabaseQuery } from "./metabase";
import { unstable_cache } from "next/cache";

export type TrendPoint = {
  label: string;
  value: number;
};

export type ChartKind = "line" | "area" | "bar";

export type TrendSlide = {
  id: string;
  title: string;
  metricLabel: string;
  unit: string;
  kind: ChartKind;
  color: string;
  softColor: string;
  data: TrendPoint[];
};

const meses = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

// Lee un archivo SQL, lo transforma de diario (30d) a mensual (12m)
async function getMonthlySql(filename: string) {
  const filePath = path.join(process.cwd(), "src", "lib", "sql", filename);
  const sql = await fs.readFile(filePath, "utf-8");
  
  return sql.replace(/;/g, "");
}

async function fetchTrend(id: string, title: string, metricLabel: string, unit: string, kind: ChartKind, colorIndex: number, sqlFile: string): Promise<TrendSlide | null> {
  try {
    const sql = await getMonthlySql(sqlFile);
    console.log(`Ejecutando SQL modificado para ${sqlFile}:`, sql.substring(0, 150) + "...");
    const rows = await metabaseQuery(sql);
    console.log(`Resultados de ${sqlFile}:`, rows ? rows.slice(0, 3) : null);
    
    // Procesar rows: [Fecha_ISO, Valor]
    const pointMap = new Map<string, number>();
    const now = new Date();
    
    // Inicializar los últimos 30 días
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const label = d.toLocaleDateString("es-VE", { day: "2-digit", month: "short" });
      pointMap.set(label, 0); // Inicializar en 0
    }
    
    for (const row of rows || []) {
      if (row.length >= 2 && row[0] != null) {
        const dateStr = String(row[0]); // Ej: "2026-07-13T00:00:00" o "2026-07-13"
        // Extraemos manualmente el año, mes y día para evitar desfases de TimeZone (UTC vs VET)
        const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          const year = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1; // Meses en JS son 0-11
          const day = parseInt(match[3], 10);
          
          const dateObj = new Date(year, month, day); // Se crea en hora local a la medianoche perfecta
          const label = dateObj.toLocaleDateString("es-VE", { day: "2-digit", month: "short" });
          
          if (pointMap.has(label)) {
            pointMap.set(label, (pointMap.get(label) || 0) + Number(row[1] || 0));
          }
        }
      }
    }
    
    const data: TrendPoint[] = Array.from(pointMap.entries()).map(([label, value]) => ({ label, value }));
    
    return {
      id,
      title,
      metricLabel,
      unit,
      kind,
      color: `var(--series-${colorIndex})`,
      softColor: `var(--series-${colorIndex}-soft)`,
      data
    };
  } catch (error) {
    console.error(`Error procesando ${sqlFile}:`, error);
    return null;
  }
}

export const getTrendSlides = unstable_cache(
  async (): Promise<TrendSlide[]> => {
    console.log("Obteniendo datos de tendencias desde Metabase...");
    const slides: TrendSlide[] = [];
    
    const recNac = await fetchTrend("recaudacion", "Recaudación Nacional", "Recaudación", "$", "line", 1, "recaudacion_regiones_nacional.sql");
    if (recNac) slides.push(recNac);
    
    const decTot = await fetchTrend("declaraciones", "Declaraciones Certificadas", "Declaraciones", "", "area", 2, "declaraciones.sql");
    if (decTot) slides.push(decTot);
    
    const pagos = await fetchTrend("pagos", "Pagos Procesados", "Pagos", "", "bar", 3, "pagosrecaudacion.sql");
    if (pagos) slides.push(pagos);
    
    return slides;
  },
  ["trend-slides-data-v3"], // Cambiar cache key para forzar la invalidación
  { revalidate: 60 } // Caché por 1 minuto (antes 3600 = 1 hora)
);
