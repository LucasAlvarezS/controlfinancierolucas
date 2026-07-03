import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncFinancialAccount } from "@/lib/integrations/sync-orchestrator";
import { verifyFintocWebhook } from "@/lib/integrations/fintoc/webhook";

export async function POST(request: NextRequest) {
  // La firma se calcula sobre el cuerpo crudo, así que se lee como texto.
  const rawBody = await request.text();
  const isValid = verifyFintocWebhook({
    signatureHeader: request.headers.get("fintoc-signature"),
    rawBody,
  });
  if (!isValid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const accountId: string | undefined =
    payload?.data?.object?.account_id ?? payload?.data?.object?.id;

  if (accountId) {
    const account = await prisma.financialAccount.findFirst({
      where: { provider: "FINTOC", externalId: accountId, status: "ACTIVE" },
    });
    if (account) {
      await syncFinancialAccount(account.id).catch(() => undefined);
    }
  }

  return NextResponse.json({ received: true });
}
