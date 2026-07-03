const MP_API_BASE = "https://api.mercadopago.com";
// La autorización OAuth usa el dominio regional (Chile), no api.mercadopago.com.
const MP_AUTH_BASE = "https://auth.mercadopago.cl";

interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: number;
  scope: string;
}

export function buildAuthorizationUrl(state: string): string {
  const clientId = process.env.MERCADOPAGO_CLIENT_ID;
  const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    throw new Error("Faltan MERCADOPAGO_CLIENT_ID / MERCADOPAGO_REDIRECT_URI");
  }

  const url = new URL(`${MP_AUTH_BASE}/authorization`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
  const response = await fetch(`${MP_API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.MERCADOPAGO_CLIENT_ID,
      client_secret: process.env.MERCADOPAGO_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.MERCADOPAGO_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error intercambiando code de Mercado Pago: ${response.status}`);
  }

  return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
  const response = await fetch(`${MP_API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.MERCADOPAGO_CLIENT_ID,
      client_secret: process.env.MERCADOPAGO_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error refrescando token de Mercado Pago: ${response.status}`);
  }

  return response.json();
}

export interface MpPayment {
  id: number;
  transaction_amount: number;
  currency_id: string;
  description: string | null;
  date_approved: string | null;
  date_created: string;
  status: string;
  operation_type?: string;
  collector_id?: number;
  collector?: { id?: number };
  payer?: { id?: number | string; email?: string };
}

const SEARCH_PAGE_SIZE = 50;
// Tope de seguridad: 20 páginas = 1000 pagos por sync.
const SEARCH_MAX_PAGES = 20;

export async function searchPayments(
  accessToken: string,
  sinceIso: string | null,
): Promise<MpPayment[]> {
  const payments: MpPayment[] = [];

  for (let page = 0; page < SEARCH_MAX_PAGES; page++) {
    const url = new URL(`${MP_API_BASE}/v1/payments/search`);
    url.searchParams.set("sort", "date_created");
    url.searchParams.set("criteria", "desc");
    url.searchParams.set("limit", String(SEARCH_PAGE_SIZE));
    url.searchParams.set("offset", String(page * SEARCH_PAGE_SIZE));
    if (sinceIso) {
      url.searchParams.set("range", "date_created");
      url.searchParams.set("begin_date", sinceIso);
      url.searchParams.set("end_date", "NOW");
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Error consultando pagos de Mercado Pago: ${response.status}`);
    }

    const data = await response.json();
    const results: MpPayment[] = data.results ?? [];
    payments.push(...results);

    if (results.length < SEARCH_PAGE_SIZE) break;
  }

  return payments;
}
