import { NextResponse } from "next/server";
import { leerConfig } from "@/lib/paneles";

export const dynamic = "force-dynamic";

// El frontend histórico consulta la configuración con POST;
// se acepta también GET por conveniencia.
export async function GET() {
  return NextResponse.json(await leerConfig());
}

export async function POST() {
  return NextResponse.json(await leerConfig());
}
