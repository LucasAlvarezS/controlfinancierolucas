import type {
  CredentialTokens,
  DiscoveredAccount,
  FinancialProvider,
  NormalizedMovement,
} from "../provider.interface";
import { getMovements, listAccounts } from "./client";
import { mapAccountToDiscovered, mapMovementToNormalized } from "./mapper";

export const fintocProvider: FinancialProvider = {
  provider: "FINTOC",

  // La API de cuentas no incluye la institución (viene en el Link, que sólo
  // se obtiene completo al canjear el exchange token en la conexión inicial),
  // por eso acá se marca OTHER. El alta real de cuentas la hace el callback
  // de conexión usando el Link canjeado, con la institución correcta.
  async listAccounts(tokens: CredentialTokens): Promise<DiscoveredAccount[]> {
    if (!tokens.linkToken) throw new Error("Falta link token de Fintoc");
    const accounts = await listAccounts(tokens.linkToken);
    return accounts.map((account) => mapAccountToDiscovered(account, "OTHER"));
  },

  async syncMovements(
    tokens: CredentialTokens,
    externalAccountId: string,
    since: Date | null,
  ): Promise<NormalizedMovement[]> {
    if (!tokens.linkToken) throw new Error("Falta link token de Fintoc");
    const movements = await getMovements(tokens.linkToken, externalAccountId, since);
    return movements.map(mapMovementToNormalized);
  },

  // El link token de Fintoc no expira como un OAuth access token; no
  // requiere refresh explícito.
  async refreshTokensIfNeeded(tokens: CredentialTokens): Promise<CredentialTokens> {
    return tokens;
  },
};
