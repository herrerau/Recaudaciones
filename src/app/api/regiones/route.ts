import { NextResponse } from "next/server";
import { getRecaudacionRegionesHoy } from "@/lib/metabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const regiones = await getRecaudacionRegionesHoy();
  return NextResponse.json({
    regiones,
    total_general: regiones.reduce((s, r) => s + r.total, 0),
    timestamp: new Date().toISOString(),
  });
}
