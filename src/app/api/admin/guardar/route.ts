import { NextRequest, NextResponse } from "next/server";
import { guardarPanel } from "@/lib/paneles";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data?.user_id) {
      return NextResponse.json(
        { error: "user_id es obligatorio" },
        { status: 400 }
      );
    }

    await guardarPanel(data);
    return NextResponse.json({
      status: "success",
      message: "Configuración guardada",
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Error al guardar: ${e instanceof Error ? e.message : e}` },
      { status: 500 }
    );
  }
}
