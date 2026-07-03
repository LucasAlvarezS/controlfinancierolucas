import type { AccountProvider } from "@prisma/client";
import type { FinancialProvider } from "./provider.interface";
import { mercadoPagoProvider } from "./mercadopago/sync";
import { fintocProvider } from "./fintoc/sync";

const registry: Partial<Record<AccountProvider, FinancialProvider>> = {
  MERCADOPAGO: mercadoPagoProvider,
  FINTOC: fintocProvider,
};

export function getProvider(provider: AccountProvider): FinancialProvider {
  const impl = registry[provider];
  if (!impl) {
    throw new Error(`No hay integración registrada para el provider "${provider}"`);
  }
  return impl;
}
