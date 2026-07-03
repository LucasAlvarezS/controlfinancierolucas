import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { syncAllAccountsForProvider } from "@/lib/integrations/sync-orchestrator";

// Margen para el primer sync grande (historial completo).
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await syncAllAccountsForProvider("MERCADOPAGO");
  return NextResponse.json({ results });
}
