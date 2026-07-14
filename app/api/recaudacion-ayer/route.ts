import { NextResponse } from "next/server";
import {
  getRecaudacionAyerBs,
  getRecaudacionAyerPorAduana,
  getRecaudacionAyerPorRegion,
  getRecaudacionAyerUsd,
} from "@/lib/metabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const [total_bs, total_usd, regiones, aduanas] = await Promise.all([
    getRecaudacionAyerBs(),
    getRecaudacionAyerUsd(),
    getRecaudacionAyerPorRegion(),
    getRecaudacionAyerPorAduana(),
  ]);

  const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const fecha = `${ayer.getFullYear()}-${String(ayer.getMonth() + 1).padStart(2, "0")}-${String(ayer.getDate()).padStart(2, "0")}`;

  return NextResponse.json({
    total_bs,
    total_usd,
    regiones: regiones.slice(0, 10),
    aduanas: aduanas.slice(0, 10),
    fecha,
  });
}
