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

// --- API de reportes (release_report) ---------------------------------------
// Los retiros / transferencias SALIENTES de la cuenta NO aparecen en
// /v1/payments/search (son otro tipo de objeto). Sí aparecen en el
// release_report, cuya generación es asíncrona: se pide (POST → 202), se espera
// a que quede listo y se descarga el CSV.

export interface MpReportListItem {
  id: number;
  file_name: string;
  date_created: string; // ISO con offset, ej. "2026-07-08T14:54:27.000-04:00"
  begin_date: string;
  end_date: string;
  status: string;
}

/** Formato que exige la API de reportes: YYYY-MM-DDTHH:mm:ssZ (sin milisegundos). */
function reportDate(date: Date, endOfDay: boolean): string {
  return `${date.toISOString().slice(0, 10)}T${endOfDay ? "23:59:59" : "00:00:00"}Z`;
}

/** Encola la generación de un release_report para el rango dado (async → 202). */
export async function requestReleaseReport(
  accessToken: string,
  begin: Date,
  end: Date,
): Promise<void> {
  const response = await fetch(`${MP_API_BASE}/v1/account/release_report`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      begin_date: reportDate(begin, false),
      end_date: reportDate(end, true),
    }),
  });
  // 202 = generación encolada. Otros no-2xx: error real.
  if (response.status !== 202 && !response.ok) {
    throw new Error(`Error generando release_report de Mercado Pago: ${response.status}`);
  }
}

/** Lista los reportes ya generados (los listos se pueden descargar). */
export async function listReleaseReports(accessToken: string): Promise<MpReportListItem[]> {
  const response = await fetch(`${MP_API_BASE}/v1/account/release_report/list`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Error listando release_report de Mercado Pago: ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/** Descarga el CSV de un reporte ya generado. */
export async function downloadReleaseReport(
  accessToken: string,
  fileName: string,
): Promise<string> {
  const response = await fetch(
    `${MP_API_BASE}/v1/account/release_report/${fileName}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) {
    throw new Error(`Error descargando release_report ${fileName}: ${response.status}`);
  }
  return response.text();
}
