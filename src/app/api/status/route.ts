import { NextResponse } from "next/server";
import {
  CACHE_DURATION,
  METABASE_DATABASE_ID,
  METABASE_DW_ID,
  TIPOS_DOCUMENTO_METABASE,
} from "@/lib/metabase";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "online",
    timestamp: new Date().toISOString(),
    cache_seconds: CACHE_DURATION,
    databases: {
      seniatfe: METABASE_DATABASE_ID,
      datawarehouse: METABASE_DW_ID,
    },
    configuracion: {
      tipos_documento: TIPOS_DOCUMENTO_METABASE.length,
      filtro_situacion: "22",
      filtro_conciliado: "N",
    },
  });
}
