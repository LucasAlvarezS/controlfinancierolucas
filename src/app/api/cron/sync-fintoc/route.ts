import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { syncAllAccountsForProvider } from "@/lib/integrations/sync-orchestrator";

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results = await syncAllAccountsForProvider("FINTOC");
  return NextResponse.json({ results });
}
