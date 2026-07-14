import { NextResponse } from "next/server";
import { verificarRecaudacion } from "@/lib/metabase";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await verificarRecaudacion());
}
