import { NextResponse } from "next/server";
import { getTopContribuyentesHoy } from "@/lib/metabase";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    contribuyentes: await getTopContribuyentesHoy(10),
    timestamp: new Date().toISOString(),
  });
}
