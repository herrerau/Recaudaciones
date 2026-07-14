import { NextResponse } from "next/server";
import { getRecaudacionAduanasHoy } from "@/lib/metabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const aduanas = await getRecaudacionAduanasHoy();
  return NextResponse.json({
    aduanas,
    total_general: aduanas.reduce((s, a) => s + a.total, 0),
    timestamp: new Date().toISOString(),
  });
}
