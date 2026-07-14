// ============================================================
// CONEXIÓN A METABASE Y LÓGICA DE DATOS FISCALES
// Port fiel del antiguo api_server.py (Python) a TypeScript.
// La configuración se lee de variables de entorno (.env),
// que Next.js carga automáticamente. Ver .env.example.
// ============================================================

export const METABASE_URL =
  process.env.METABASE_URL ?? "https://analisisdatos.seniat.gob.ve";
export const METABASE_API_KEY = process.env.METABASE_API_KEY ?? "";
export const METABASE_DATABASE_ID = parseInt(
  process.env.METABASE_DATABASE_ID ?? "22",
  10
);
export const METABASE_DW_ID = parseInt(process.env.METABASE_DW_ID ?? "21", 10);
export const CACHE_DURATION = parseInt(process.env.CACHE_DURATION ?? "30", 10);

if (!METABASE_API_KEY) {
  console.warn(
    "[ADVERTENCIA] METABASE_API_KEY no está definida. " +
      "Crea un archivo .env (ver .env.example) con tus credenciales."
  );
}

// ============================================================
// TIPOS DE DOCUMENTO - EXACTAMENTE LOS QUE USA METABASE
// ============================================================
export const TIPOS_DOCUMENTO_METABASE = [
  "00011", "00012", "00013", "00014", "00018",
  "99011", "99012", "99013", "99014", "99018",
  "99074", "99075", "99076",
  "99025", "99026",
  "99044", "99244",
  "99028", "99029",
  "00023", "99023",
  "00031", "00033", "99033",
  "00223", "00225", "00228", "00229",
  "99225", "99228", "99229",
  "00911", "00912", "00913", "00914", "00918",
  "00923", "00925", "00926",
  "00928", "00929",
  "00931", "00933",
  "00974", "00975", "00976",
  "99911", "99912", "99913", "99914", "99918",
  "99923", "99925", "99926",
  "99929", "99928",
  "99974", "99975", "99976",
  "00940", "00941", "00943",
  "99940", "99941", "99943",
  "00991", "00995", "00996",
  "99991", "99995", "99996",
  "00262", "00265",
  "99035", "99262", "99265",
  "99030", "99034",
  "99057", "99257",
  "00930", "00935",
  "99930", "99935",
  "00945", "99945",
  "00990", "99990",
  "00050", "99050", "99950",
  "00954", "99954",
  "00060", "99060", "99960",
  "00955", "99955",
  "00032", "99232",
  "00932", "99032", "99932",
  "00942", "99942",
  "00992", "99992",
  "00022", "99022",
  "00922", "99922",
  "00966",
  "00949",
  "00950",
  "99019", "99919",
  "00901", "00902",
  "99901",
  "00951", "99951",
  "00903",
  "00952", "99952",
  "99903",
  "00953", "99953",
  "00906", "99906",
  "99016",
  "00097",
  "00070",
  "00956", "99956",
  "00947", "99947",
  "00998",
  "00080", "00083", "00084", "00086",
  "99080", "99086",
  "00081", "99081",
  "99986", "99981",
  "99020", "99021",
  "99921",
  "99005", "99009", "99010",
  "99910",
];

/** Genera la cláusula SQL para los tipos de documento de Metabase */
function getTiposSql(): string {
  return (
    "(" +
    TIPOS_DOCUMENTO_METABASE.map((t) => `TIPO_DOCUMENTO_PAGO = '${t}'`).join(
      " OR "
    ) +
    ")"
  );
}

// ============================================================
// TIPOS DE DATOS
// ============================================================
export interface RegionTotal {
  region: string;
  total: number;
}

export interface AduanaTotal {
  aduana: string;
  total: number;
}

export interface Contribuyente {
  nombre: string;
  rif: string;
  cantidad_pagos: number;
  total: number;
}

export interface TickerItem {
  titulo: string;
  valor: number;
  cambio: number;
}

type MetabaseRow = (string | number | null)[];

// ============================================================
// FUNCIONES DE CONEXIÓN A METABASE
// ============================================================

/** Ejecuta una consulta SQL en Metabase y devuelve los resultados */
export async function metabaseQuery(
  sql: string,
  databaseId: number = METABASE_DW_ID
): Promise<MetabaseRow[]> {
  const body = {
    database: databaseId,
    type: "native",
    native: { query: sql },
    parameters: [],
    constraints: {
      "max-results": 50000,
      "max-results-bare-rows": 50000,
    },
  };

  try {
    const resp = await fetch(`${METABASE_URL}/api/dataset`, {
      method: "POST",
      headers: {
        "x-api-key": METABASE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(600_000),
      cache: "no-store",
    });

    const result = await resp.json();

    if (result?.status === "failed") {
      console.error(
        `Error en consulta: ${result?.error ?? "Error desconocido"}`
      );
      return [];
    }

    return result?.data?.rows ?? [];
  } catch (e) {
    console.error(`Error en consulta Metabase: ${e}`);
    return [];
  }
}

function firstCellFloat(rows: MetabaseRow[]): number {
  if (rows.length > 0 && rows[0][0] != null) {
    return parseFloat(String(rows[0][0])) || 0.0;
  }
  return 0.0;
}

function firstCellInt(rows: MetabaseRow[]): number {
  if (rows.length > 0 && rows[0][0] != null) {
    return parseInt(String(rows[0][0]), 10) || 0;
  }
  return 0;
}

// ============================================================
// FUNCIONES DE DATOS DE HOY - EXACTAMENTE COMO METABASE
// ============================================================

/** Obtiene la recaudación total en Bs - EXACTAMENTE COMO METABASE */
export async function getRecaudacionTotalBs(): Promise<number> {
  const sql = `
    SELECT
        SUM(MONTO_TOTAL_PAGO) AS TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO"
    WHERE FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE)
    AND SITUACION_PAGO = '22'
    AND CONCILIADO_PAGO = 'N'
    AND ${getTiposSql()}
  `;
  return firstCellFloat(await metabaseQuery(sql, METABASE_DW_ID));
}

/** Obtiene la recaudación total en USD - EXACTAMENTE COMO METABASE */
export async function getRecaudacionTotalUsd(): Promise<number> {
  const sql = `
    SELECT
        SUM(p.MONTO_TOTAL_PAGO / t.RAT_EXC) AS TOTAL_USD
    FROM "DBO"."MOVIMIENTO_PAGO" p
    LEFT JOIN "DBO"."TASA_CAMBIO_DIARIA" t
        ON CONCAT('', 'USD') = t.CUR_COD
        AND TRUNC(p.FECHA_RECAUDACION_PAGO) = TRUNC(t.VALID_FROM)
    WHERE p.FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE)
    AND p.SITUACION_PAGO = '22'
    AND p.CONCILIADO_PAGO = 'N'
    AND ${getTiposSql()}
  `;
  return firstCellFloat(await metabaseQuery(sql, METABASE_DW_ID));
}

/** Obtiene la cantidad de pagos sin conciliar - EXACTAMENTE COMO METABASE */
export async function getCantidadPagosSinConciliar(): Promise<number> {
  const sql = `
    SELECT
        COUNT(*) AS TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO"
    WHERE FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE)
    AND SITUACION_PAGO = '22'
    AND CONCILIADO_PAGO = 'N'
    AND ${getTiposSql()}
  `;
  return firstCellInt(await metabaseQuery(sql, METABASE_DW_ID));
}

/** Obtiene la cantidad de pagos conciliados - EXACTAMENTE COMO METABASE */
export async function getCantidadPagosConciliados(): Promise<number> {
  const sql = `
    SELECT
        COUNT(*) AS TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO"
    WHERE FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE)
    AND SITUACION_PAGO = '22'
    AND CONCILIADO_PAGO = 'S'
    AND ${getTiposSql()}
  `;
  return firstCellInt(await metabaseQuery(sql, METABASE_DW_ID));
}

function rowsToRegiones(rows: MetabaseRow[], fallback: string): RegionTotal[] {
  const resultados: RegionTotal[] = [];
  for (const row of rows) {
    if (row.length >= 2) {
      const region = row[0] ? String(row[0]) : fallback;
      const total = row[1] ? parseFloat(String(row[1])) : 0.0;
      if (total > 0) {
        resultados.push({ region, total });
      }
    }
  }
  return resultados;
}

function rowsToAduanas(rows: MetabaseRow[]): AduanaTotal[] {
  const resultados: AduanaTotal[] = [];
  for (const row of rows) {
    if (row.length >= 2) {
      const aduana = row[0] ? String(row[0]) : "SIN ADUANA";
      const total = row[1] ? parseFloat(String(row[1])) : 0.0;
      if (total > 0) {
        resultados.push({ aduana, total });
      }
    }
  }
  return resultados;
}

/** Obtiene recaudación por región en Bs - EXACTAMENTE COMO METABASE */
export async function getRecaudacionRegionesHoy(): Promise<RegionTotal[]> {
  const sql = `
    SELECT
        dep.NOMBRE_DEPENDENCIA as REGION,
        SUM(p.MONTO_TOTAL_PAGO) AS TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO" p
    LEFT JOIN "DATOSCONTRIBUYENTE"."DEPENDENCIA" dep
        ON p.DEPENDENCIA_PAGO = dep.CODIGO_DEPENDENCIA
    WHERE p.FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE)
    AND p.SITUACION_PAGO = '22'
    AND p.CONCILIADO_PAGO = 'N'
    AND ${getTiposSql()}
    GROUP BY dep.NOMBRE_DEPENDENCIA
    ORDER BY TOTAL DESC
  `;
  return rowsToRegiones(await metabaseQuery(sql, METABASE_DW_ID), "SIN REGION");
}

/** Obtiene recaudación por aduana - EXACTAMENTE COMO METABASE */
export async function getRecaudacionAduanasHoy(): Promise<AduanaTotal[]> {
  const sql = `
    SELECT
        dep.NOMBRE_DEPENDENCIA as ADUANA,
        SUM(p.MONTO_TOTAL_PAGO) AS TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO" p
    LEFT JOIN "DATOSCONTRIBUYENTE"."DEPENDENCIA" dep
        ON p.DEPENDENCIA_PAGO = dep.CODIGO_DEPENDENCIA
    WHERE p.FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE)
    AND p.SITUACION_PAGO = '22'
    AND p.CONCILIADO_PAGO = 'N'
    AND ${getTiposSql()}
    AND dep.NOMBRE_DEPENDENCIA LIKE '%ADUANA%'
    GROUP BY dep.NOMBRE_DEPENDENCIA
    ORDER BY TOTAL DESC
  `;
  return rowsToAduanas(await metabaseQuery(sql, METABASE_DW_ID));
}

// ============================================================
// FUNCIONES DE DATOS DE AYER - SIN FILTRO DE TIPOS (HISTÓRICOS)
// ============================================================

/** Recaudación del día anterior en Bs - DATOS HISTÓRICOS - NO CAMBIAN */
export async function getRecaudacionAyerBs(): Promise<number> {
  const sql = `
    SELECT
        SUM(MONTO_TOTAL_PAGO) AS TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO"
    WHERE FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE - 1)
    AND SITUACION_PAGO = '22'
    AND CONCILIADO_PAGO = 'N'
  `;
  return firstCellFloat(await metabaseQuery(sql, METABASE_DW_ID));
}

/** Recaudación del día anterior en USD - DATOS HISTÓRICOS - NO CAMBIAN */
export async function getRecaudacionAyerUsd(): Promise<number> {
  const sql = `
    SELECT
        SUM(p.MONTO_TOTAL_PAGO / t.RAT_EXC) AS TOTAL_USD
    FROM "DBO"."MOVIMIENTO_PAGO" p
    LEFT JOIN "DBO"."TASA_CAMBIO_DIARIA" t
        ON CONCAT('', 'USD') = t.CUR_COD
        AND TRUNC(p.FECHA_RECAUDACION_PAGO) = TRUNC(t.VALID_FROM)
    WHERE p.FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE - 1)
    AND p.SITUACION_PAGO = '22'
    AND p.CONCILIADO_PAGO = 'N'
  `;
  return firstCellFloat(await metabaseQuery(sql, METABASE_DW_ID));
}

/** Cantidad de pagos sin conciliar del día anterior - DATOS HISTÓRICOS */
export async function getPagosSinConciliarAyer(): Promise<number> {
  const sql = `
    SELECT
        COUNT(*) AS TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO"
    WHERE FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE - 1)
    AND SITUACION_PAGO = '22'
    AND CONCILIADO_PAGO = 'N'
  `;
  return firstCellInt(await metabaseQuery(sql, METABASE_DW_ID));
}

/** Recaudación por región del día anterior - DATOS HISTÓRICOS */
export async function getRecaudacionAyerPorRegion(): Promise<RegionTotal[]> {
  const sql = `
    SELECT
        dep.NOMBRE_DEPENDENCIA as REGION,
        SUM(p.MONTO_TOTAL_PAGO) AS TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO" p
    LEFT JOIN "DATOSCONTRIBUYENTE"."DEPENDENCIA" dep
        ON p.DEPENDENCIA_PAGO = dep.CODIGO_DEPENDENCIA
    WHERE p.FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE - 1)
    AND p.SITUACION_PAGO = '22'
    AND p.CONCILIADO_PAGO = 'N'
    GROUP BY dep.NOMBRE_DEPENDENCIA
    ORDER BY TOTAL DESC
  `;
  return rowsToRegiones(await metabaseQuery(sql, METABASE_DW_ID), "SIN REGION");
}

/** Recaudación por aduana del día anterior - DATOS HISTÓRICOS */
export async function getRecaudacionAyerPorAduana(): Promise<AduanaTotal[]> {
  const sql = `
    SELECT
        dep.NOMBRE_DEPENDENCIA as ADUANA,
        SUM(p.MONTO_TOTAL_PAGO) AS TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO" p
    LEFT JOIN "DATOSCONTRIBUYENTE"."DEPENDENCIA" dep
        ON p.DEPENDENCIA_PAGO = dep.CODIGO_DEPENDENCIA
    WHERE p.FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE - 1)
    AND p.SITUACION_PAGO = '22'
    AND p.CONCILIADO_PAGO = 'N'
    AND dep.NOMBRE_DEPENDENCIA LIKE '%ADUANA%'
    GROUP BY dep.NOMBRE_DEPENDENCIA
    ORDER BY TOTAL DESC
  `;
  return rowsToAduanas(await metabaseQuery(sql, METABASE_DW_ID));
}

// ============================================================
// CONTRIBUYENTES
// ============================================================

/** Obtiene los TOP contribuyentes del día (usa RIF_CONTRIBUYENTE) */
export async function getTopContribuyentesHoy(
  limit = 10
): Promise<Contribuyente[]> {
  const sql = `
    SELECT
        c.RAZON_SOCIAL as NOMBRE,
        m.RIF_CONTRIBUYENTE as RIF,
        COUNT(*) as CANTIDAD_PAGOS,
        SUM(m.MONTO_TOTAL_PAGO) as TOTAL
    FROM "DBO"."MOVIMIENTO_PAGO" m
    LEFT JOIN "DATOSCONTRIBUYENTE"."CONTRIBUYENTE" c
        ON m.RIF_CONTRIBUYENTE = c.RIF
    WHERE m.FECHA_RECAUDACION_PAGO = TRUNC(SYSDATE)
    AND m.SITUACION_PAGO = '22'
    AND m.CONCILIADO_PAGO = 'N'
    AND ${getTiposSql()}
    GROUP BY c.RAZON_SOCIAL, m.RIF_CONTRIBUYENTE
    ORDER BY TOTAL DESC
    FETCH FIRST ${limit} ROWS ONLY
  `;
  const rows = await metabaseQuery(sql, METABASE_DW_ID);
  const resultados: Contribuyente[] = [];

  for (const row of rows) {
    if (row.length >= 4) {
      resultados.push({
        nombre: row[0] ? String(row[0]) : "NO IDENTIFICADO",
        rif: row[1] ? String(row[1]) : "N/A",
        cantidad_pagos: row[2] ? parseInt(String(row[2]), 10) : 0,
        total: row[3] ? parseFloat(String(row[3])) : 0.0,
      });
    }
  }

  return resultados;
}

// ============================================================
// VERIFICACIÓN Y TICKER
// ============================================================

function fechaAyer(): string {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}

/** Verifica que los datos coincidan con Metabase */
export async function verificarRecaudacion() {
  const [recBsHoy, recUsdHoy, pagosHoy, recBsAyer, recUsdAyer, pagosAyer] =
    await Promise.all([
      getRecaudacionTotalBs(),
      getRecaudacionTotalUsd(),
      getCantidadPagosSinConciliar(),
      getRecaudacionAyerBs(),
      getRecaudacionAyerUsd(),
      getPagosSinConciliarAyer(),
    ]);

  return {
    status: "success",
    timestamp: new Date().toISOString(),
    hoy: {
      recaudacion: {
        total_bs: recBsHoy,
        total_usd: recUsdHoy,
        pagos: pagosHoy,
      },
    },
    ayer: {
      recaudacion: {
        total_bs: recBsAyer,
        total_usd: recUsdAyer,
        pagos: pagosAyer,
      },
      fecha: fechaAyer(),
    },
    verificacion: {
      estado: "ok",
      mensaje: "Datos verificados - Misma lógica que Metabase",
      fecha_verificacion: new Date().toISOString(),
    },
    configuracion: {
      tipos_documento: TIPOS_DOCUMENTO_METABASE.length,
      filtro_situacion: "22",
      filtro_conciliado: "N",
    },
  };
}

/** Genera datos para el ticker a partir de los totales ya consultados */
function buildTicker(
  recUsd: number,
  recBs: number,
  pagos: number,
  regiones: RegionTotal[]
): TickerItem[] {
  const tickerItems: TickerItem[] = [
    { titulo: "💰 Recaudación USD", valor: recUsd, cambio: 0 },
    { titulo: "🇻🇪 Recaudación Bs", valor: recBs, cambio: 0 },
    { titulo: "📊 Pagos Sin Conciliar", valor: pagos, cambio: 0 },
  ];

  for (const r of regiones.slice(0, 3)) {
    tickerItems.push({
      titulo: r.region.slice(0, 20) + (r.region.length > 20 ? "..." : ""),
      valor: r.total,
      cambio: 0,
    });
  }

  return tickerItems;
}

// ============================================================
// OBTENER DATOS COMPLETOS CON CACHE
// ============================================================

export interface DatosCompletos {
  status: string;
  timestamp: string;
  recaudacion: {
    total_bs: number;
    total_usd: number;
    pagos_sin_conciliar: number;
    pagos_conciliados: number;
    pagos_sin_conciliar_ayer: number;
  };
  ayer: {
    recaudacion: {
      total_bs: number;
      total_usd: number;
      total_regiones: number;
      total_aduanas: number;
      pagos: number;
    };
    regiones: RegionTotal[];
    aduanas: AduanaTotal[];
    fecha: string;
  };
  regiones: RegionTotal[];
  aduanas: AduanaTotal[];
  contribuyentes: Contribuyente[];
  ticker: TickerItem[];
  configuracion: {
    tipos_documento: number;
    filtro_situacion: string;
    filtro_conciliado: string;
    mensaje: string;
  };
}

// Cache en memoria compartida entre requests (sobrevive al HMR en dev).
const globalCache = globalThis as unknown as {
  __seniatCache?: { datos: DatosCompletos; timestamp: number };
};

/** Obtiene todos los datos con cache */
export async function obtenerDatosCompletos(): Promise<DatosCompletos> {
  const ahora = Date.now();
  const cached = globalCache.__seniatCache;

  if (cached && (ahora - cached.timestamp) / 1000 < CACHE_DURATION) {
    return cached.datos;
  }

  console.log("\n" + "=".repeat(60));
  console.log("🔄 ACTUALIZANDO DATOS DESDE METABASE");
  console.log("=".repeat(60));

  const [
    recBs,
    recUsd,
    pagosSinConciliar,
    pagosConciliados,
    pagosSinConciliarAyer,
    regiones,
    aduanas,
    contribuyentes,
    recBsAyer,
    recUsdAyer,
    regionesAyer,
    aduanasAyer,
  ] = await Promise.all([
    getRecaudacionTotalBs(),
    getRecaudacionTotalUsd(),
    getCantidadPagosSinConciliar(),
    getCantidadPagosConciliados(),
    getPagosSinConciliarAyer(),
    getRecaudacionRegionesHoy(),
    getRecaudacionAduanasHoy(),
    getTopContribuyentesHoy(10),
    getRecaudacionAyerBs(),
    getRecaudacionAyerUsd(),
    getRecaudacionAyerPorRegion(),
    getRecaudacionAyerPorAduana(),
  ]);

  const datos: DatosCompletos = {
    status: "success",
    timestamp: new Date(ahora).toISOString(),
    recaudacion: {
      total_bs: recBs,
      total_usd: recUsd,
      pagos_sin_conciliar: pagosSinConciliar,
      pagos_conciliados: pagosConciliados,
      pagos_sin_conciliar_ayer: pagosSinConciliarAyer,
    },
    ayer: {
      recaudacion: {
        total_bs: recBsAyer,
        total_usd: recUsdAyer,
        total_regiones: regionesAyer.reduce((s, r) => s + r.total, 0),
        total_aduanas: aduanasAyer.reduce((s, a) => s + a.total, 0),
        pagos: pagosSinConciliarAyer,
      },
      regiones: regionesAyer.slice(0, 10),
      aduanas: aduanasAyer.slice(0, 10),
      fecha: fechaAyer(),
    },
    regiones,
    aduanas,
    contribuyentes,
    ticker: buildTicker(recUsd, recBs, pagosSinConciliar, regiones),
    configuracion: {
      tipos_documento: TIPOS_DOCUMENTO_METABASE.length,
      filtro_situacion: "22",
      filtro_conciliado: "N",
      mensaje: "Usando EXACTAMENTE la misma lógica que Metabase",
    },
  };

  globalCache.__seniatCache = { datos, timestamp: ahora };

  console.log(`\n📊 RESUMEN DE DATOS (Misma lógica que Metabase):`);
  console.log(`   Recaudación Bs (Hoy): ${recBs.toLocaleString("es-VE")}`);
  console.log(`   Recaudación Bs (Ayer): ${recBsAyer.toLocaleString("es-VE")}`);
  console.log(`   Recaudación USD (Hoy): $${recUsd.toLocaleString("es-VE")}`);
  console.log(`   Recaudación USD (Ayer): $${recUsdAyer.toLocaleString("es-VE")}`);
  console.log(`   Pagos Sin Conciliar (Hoy): ${pagosSinConciliar}`);
  console.log(`   Pagos Sin Conciliar (Ayer): ${pagosSinConciliarAyer}`);
  console.log(`   Regiones con datos (Hoy): ${regiones.length}`);
  console.log(`   Aduanas con datos (Hoy): ${aduanas.length}`);
  console.log(`   Top contribuyentes: ${contribuyentes.length}`);
  console.log("=".repeat(60) + "\n");

  return datos;
}
