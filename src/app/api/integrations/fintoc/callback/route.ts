import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { requireUserId } from "@/lib/session";
import { exchangeLinkIntent } from "@/lib/integrations/fintoc/client";
import { mapInstitution } from "@/lib/integrations/fintoc/mapper";

export async function POST(request: NextRequest) {
  const userId = await requireUserId();
  const { exchangeToken } = await request.json();

  if (typeof exchangeToken !== "string") {
    return NextResponse.json({ error: "Falta exchangeToken" }, { status: 400 });
  }

  // El link_token sólo viene en esta respuesta: se persiste cifrado.
  const link = await exchangeLinkIntent(exchangeToken);
  const institution = mapInstitution(link.institution.id);

  const created = [];
  for (const account of link.accounts ?? []) {
    const alias = account.official_name ?? account.name;

    // Evita duplicar cuentas al reconectar el mismo banco. Un link nuevo puede
    // traer otro id de cuenta, por eso el fallback matchea por institución+alias
    // (revive cuentas desconectadas conservando su historial de movimientos).
    const existing =
      (await prisma.financialAccount.findFirst({
        where: { userId, provider: "FINTOC", externalId: account.id },
      })) ??
      (await prisma.financialAccount.findFirst({
        where: { userId, provider: "FINTOC", institution, alias },
      }));

    if (existing) {
      // upsert: "Desconectar" borra la credencial, así que puede no existir.
      await prisma.integrationCredential.upsert({
        where: { financialAccountId: existing.id },
        update: { linkTokenEncrypted: encrypt(link.link_token) },
        create: {
          financialAccountId: existing.id,
          provider: "FINTOC",
          linkTokenEncrypted: encrypt(link.link_token),
        },
      });
      await prisma.financialAccount.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", externalId: account.id },
      });
      continue;
    }

    const financialAccount = await prisma.financialAccount.create({
      data: {
        userId,
        provider: "FINTOC",
        institution,
        externalId: account.id,
        alias: account.official_name ?? account.name,
        currency: account.currency,
        isSavings: institution === "BANCO_DE_CHILE",
        status: "ACTIVE",
      },
    });

    await prisma.integrationCredential.create({
      data: {
        financialAccountId: financialAccount.id,
        provider: "FINTOC",
        linkTokenEncrypted: encrypt(link.link_token),
      },
    });

    created.push(financialAccount.id);
  }

  return NextResponse.json({ created });
}
