import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { syncAllAccountsForProvider } from "@/lib/integrations/sync-orchestrator";

// Margen para el primer sync grande (historial completo).
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Un tropiezo transitorio (blip de DB, caída del proveedor) no debe devolver
  // 5xx y hacer fallar el workflow en falso: se responde 200 con {ok:false} y el
  // detalle, para que el cron lo reporte sin romper la corrida.
  try {
    const results = await syncAllAccountsForProvider("FINTOC");
    const ok = results.every((result) => !result.error);
    return NextResponse.json({ ok, results });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
