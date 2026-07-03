// Cliente de la API de Fintoc, siguiendo el flujo con exchange token de
// https://docs.fintoc.com/docs/integration-with-exchange-token:
//   1. POST /v1/link_intents        -> widget_token para abrir el widget
//   2. (frontend) widget onSuccess  -> exchange_token
//   3. GET /v1/links/exchange       -> Link con link_token y sus cuentas
//   4. GET /v1/accounts/{id}/movements?link_token=... -> movimientos

const FINTOC_API_BASE = "https://api.fintoc.com/v1";

function secretKey(): string {
  const key = process.env.FINTOC_SECRET_KEY;
  if (!key) throw new Error("Falta FINTOC_SECRET_KEY");
  return key;
}

export interface FintocAccount {
  id: string;
  name: string;
  official_name?: string | null;
  currency: string;
  type: string;
  balance?: { available: number; current: number };
}

export interface FintocLink {
  id: string;
  link_token: string;
  institution: { id: string; name: string; country: string };
  holder_type: string;
  status: string;
  accounts?: FintocAccount[];
}

export interface FintocMovement {
  id: string;
  amount: number;
  currency: string;
  description: string;
  transaction_date: string | null;
  post_date: string;
}

/** Crea un link intent y devuelve el widget_token para abrir el widget. */
export async function createLinkIntent(): Promise<{ widgetToken: string }> {
  const response = await fetch(`${FINTOC_API_BASE}/link_intents`, {
    method: "POST",
    headers: {
      Authorization: secretKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      country: "cl",
      holder_type: "individual",
      product: "movements",
    }),
  });

  if (!response.ok) {
    throw new Error(`Error creando link intent de Fintoc: ${response.status}`);
  }

  const data = await response.json();
  return { widgetToken: data.widget_token };
}

/**
 * Canjea el exchange_token que devuelve el widget por el Link completo.
 * El link_token sólo se devuelve en esta respuesta: hay que persistirlo.
 */
export async function exchangeLinkIntent(exchangeToken: string): Promise<FintocLink> {
  const url = new URL(`${FINTOC_API_BASE}/links/exchange`);
  url.searchParams.set("exchange_token", exchangeToken);

  const response = await fetch(url, {
    headers: { Authorization: secretKey() },
  });

  if (!response.ok) {
    throw new Error(`Error canjeando exchange token de Fintoc: ${response.status}`);
  }

  return response.json();
}

export async function listAccounts(linkToken: string): Promise<FintocAccount[]> {
  const url = new URL(`${FINTOC_API_BASE}/accounts`);
  url.searchParams.set("link_token", linkToken);

  const response = await fetch(url, {
    headers: { Authorization: secretKey() },
  });

  if (!response.ok) {
    throw new Error(`Error obteniendo cuentas de Fintoc: ${response.status}`);
  }

  return response.json();
}

export async function getMovements(
  linkToken: string,
  accountId: string,
  since: Date | null,
): Promise<FintocMovement[]> {
  const url = new URL(`${FINTOC_API_BASE}/accounts/${accountId}/movements`);
  url.searchParams.set("link_token", linkToken);
  url.searchParams.set("per_page", "300");
  if (since) {
    url.searchParams.set("since", since.toISOString().slice(0, 10));
  }

  const response = await fetch(url, {
    headers: { Authorization: secretKey() },
  });

  if (!response.ok) {
    throw new Error(`Error obteniendo movimientos de Fintoc: ${response.status}`);
  }

  return response.json();
}
