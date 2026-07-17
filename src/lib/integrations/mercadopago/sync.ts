import type {
  CredentialTokens,
  DiscoveredAccount,
  FinancialProvider,
  NormalizedMovement,
} from "../provider.interface";
import {
  downloadReleaseReport,
  listReleaseReports,
  refreshAccessToken,
  requestReleaseReport,
  searchPayments,
} from "./client";
import { isImportablePayment, mapPaymentToMovement } from "./mapper";
import { parseReleaseReport } from "./report";

// Ventana de historial que cubre cada release_report generado. Los retiros
// tardan a lo sumo unos días en asentarse; 45 días da margen y cubre todo el
// rango que muestra el dashboard (desde junio 2026).
const REPORT_WINDOW_DAYS = 45;
// Si el reporte más nuevo es más viejo que esto, se pide uno fresco (evita
// generar un reporte nuevo en cada corrida horaria).
const REPORT_REFRESH_HOURS = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Trae los retiros / transferencias salientes desde el release_report. Como la
 * generación es asíncrona, cada corrida (1) pide un reporte fresco si el último
 * ya está viejo y (2) consume el reporte listo más reciente. Así los retiros
 * aparecen con consistencia eventual sin bloquear la función serverless.
 *
 * Es best-effort: cualquier fallo de la API de reportes se traga y se devuelve
 * `[]`, para que el sync de payments siga siendo válido.
 */
async function fetchWithdrawalsFromReport(accessToken: string): Promise<NormalizedMovement[]> {
  try {
    const now = new Date();
    const reports = await listReleaseReports(accessToken);

    const newestCreatedAt = reports
      .map((report) => new Date(report.date_created).getTime())
      .filter((time) => Number.isFinite(time))
      .sort((a, b) => b - a)[0];
    const isStale =
      !newestCreatedAt || now.getTime() - newestCreatedAt > REPORT_REFRESH_HOURS * 60 * 60 * 1000;
    if (isStale) {
      await requestReleaseReport(
        accessToken,
        new Date(now.getTime() - REPORT_WINDOW_DAYS * DAY_MS),
        now,
      );
    }

    if (reports.length === 0) return [];
    const latest = [...reports].sort(
      (a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime(),
    )[0];
    const csv = await downloadReleaseReport(accessToken, latest.file_name);
    return parseReleaseReport(csv);
  } catch (error) {
    console.error("[MP] release_report falló; se continúa solo con payments:", error);
    return [];
  }
}

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
    const paymentMovements = payments
      .filter((payment) => isImportablePayment(payment, externalAccountId))
      .map((payment) => mapPaymentToMovement(payment, externalAccountId));

    // Los retiros/salidas no están en payments/search: se importan del
    // release_report en la misma pasada (duplicados se filtran por externalId).
    const withdrawals = await fetchWithdrawalsFromReport(tokens.accessToken);

    return [...paymentMovements, ...withdrawals];
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
