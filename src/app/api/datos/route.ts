import { NextResponse } from "next/server";
import { obtenerDatosCompletos } from "@/lib/metabase";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await obtenerDatosCompletos());
}
