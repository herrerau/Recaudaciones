import { NextResponse } from "next/server";
import {
  getCantidadPagosConciliados,
  getCantidadPagosSinConciliar,
  getPagosSinConciliarAyer,
  getRecaudacionTotalBs,
  getRecaudacionTotalUsd,
} from "@/lib/metabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const [
    total_bs,
    total_usd,
    pagos_sin_conciliar,
    pagos_conciliados,
    pagos_sin_conciliar_ayer,
  ] = await Promise.all([
    getRecaudacionTotalBs(),
    getRecaudacionTotalUsd(),
    getCantidadPagosSinConciliar(),
    getCantidadPagosConciliados(),
    getPagosSinConciliarAyer(),
  ]);

  return NextResponse.json({
    total_bs,
    total_usd,
    pagos_sin_conciliar,
    pagos_conciliados,
    pagos_sin_conciliar_ayer,
  });
}
