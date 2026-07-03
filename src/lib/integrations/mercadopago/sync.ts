import type {
  CredentialTokens,
  DiscoveredAccount,
  FinancialProvider,
  NormalizedMovement,
} from "../provider.interface";
import { refreshAccessToken, searchPayments } from "./client";
import { isImportablePayment, mapPaymentToMovement } from "./mapper";

export const mercadoPagoProvider: FinancialProvider = {
  provider: "MERCADOPAGO",

  async listAccounts(tokens: CredentialTokens): Promise<DiscoveredAccount[]> {
    if (!tokens.accessToken) throw new Error("Falta access token de Mercado Pago");

    const response = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    if (!response.ok) {
      throw new Error(`Error consultando cuenta de Mercado Pago: ${response.status}`);
    }
    const me = await response.json();

    return [
      {
        externalId: String(me.id),
        alias: me.nickname ?? "Mercado Pago",
        currency: me.site_id === "MLC" ? "CLP" : "CLP",
        institution: "MERCADOPAGO",
      },
    ];
  },

  async syncMovements(
    tokens: CredentialTokens,
    externalAccountId: string,
    since: Date | null,
  ): Promise<NormalizedMovement[]> {
    if (!tokens.accessToken) throw new Error("Falta access token de Mercado Pago");
    const payments = await searchPayments(tokens.accessToken, since?.toISOString() ?? null);
    // externalAccountId es el user id de MP: define la dirección del dinero.
    return payments
      .filter((payment) => isImportablePayment(payment, externalAccountId))
      .map((payment) => mapPaymentToMovement(payment, externalAccountId));
  },

  async refreshTokensIfNeeded(tokens: CredentialTokens): Promise<CredentialTokens> {
    if (!tokens.expiresAt || tokens.expiresAt.getTime() > Date.now() + 60_000) {
      return tokens;
    }
    if (!tokens.refreshToken) {
      throw new Error("Token de Mercado Pago vencido y sin refresh token disponible");
    }

    const refreshed = await refreshAccessToken(tokens.refreshToken);
    return {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      scopes: refreshed.scope,
    };
  },
};
