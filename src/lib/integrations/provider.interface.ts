import type { AccountProvider, Institution } from "@prisma/client";

export interface NormalizedMovement {
  externalId: string;
  amount: number;
  currency: string;
  description: string;
  merchantRaw?: string;
  date: Date;
  raw: unknown;
}

export interface DiscoveredAccount {
  externalId: string;
  alias: string;
  currency: string;
  institution: Institution;
  /** Saldo disponible, si el proveedor lo expone (Fintoc sí, Mercado Pago no). */
  balance?: number | null;
}

export interface CredentialTokens {
  accessToken?: string;
  refreshToken?: string;
  linkToken?: string;
  expiresAt?: Date;
  scopes?: string;
}

/**
 * Contrato común que debe implementar cada integración externa
 * (Mercado Pago, Fintoc, futuros bancos). El motor de sync y el de
 * categorización sólo dependen de esta interfaz.
 */
export interface FinancialProvider {
  readonly provider: AccountProvider;

  /** Lista las cuentas disponibles para las credenciales ya obtenidas. */
  listAccounts(tokens: CredentialTokens): Promise<DiscoveredAccount[]>;

  /** Trae movimientos nuevos desde `since` (o todo el historial si es null). */
  syncMovements(
    tokens: CredentialTokens,
    externalAccountId: string,
    since: Date | null,
  ): Promise<NormalizedMovement[]>;

  /** Refresca el access token si venció; devuelve los tokens actualizados. */
  refreshTokensIfNeeded(tokens: CredentialTokens): Promise<CredentialTokens>;
}
