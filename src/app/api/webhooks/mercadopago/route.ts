import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncFinancialAccount } from "@/lib/integrations/sync-orchestrator";
import { verifyMercadoPagoWebhook } from "@/lib/integrations/mercadopago/webhook";

export async function POST(request: NextRequest) {
  const isValid = verifyMercadoPagoWebhook({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId: request.nextUrl.searchParams.get("data.id"),
  });
  if (!isValid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const payload = await request.json();
  const mpUserId = payload.user_id ? String(payload.user_id) : null;

  if (mpUserId) {
    const account = await prisma.financialAccount.findFirst({
      where: { provider: "MERCADOPAGO", externalId: mpUserId, status: "ACTIVE" },
    });
    if (account) {
      await syncFinancialAccount(account.id).catch(() => undefined);
    }
  }

  return NextResponse.json({ received: true });
}
