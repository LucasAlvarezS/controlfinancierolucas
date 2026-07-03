import { createHmac } from "crypto";
import { timingSafeEqualHex } from "@/lib/encryption";

// Tolerancia contra replay: la notificación debe ser reciente.
const TOLERANCE_SECONDS = 5 * 60;

/**
 * Valida el header `Fintoc-Signature` de un webhook de Fintoc
 * (formato `t=<unix>,v1=<hmac hex>`): HMAC-SHA256 de `<t>.<cuerpo crudo>`
 * con el secreto del endpoint de webhooks (whsec_...).
 *
 * Si `FINTOC_WEBHOOK_SECRET` no está configurada se rechaza todo.
 */
export function verifyFintocWebhook(params: {
  signatureHeader: string | null;
  rawBody: string;
}): boolean {
  const secret = process.env.FINTOC_WEBHOOK_SECRET;
  if (!secret || !params.signatureHeader) return false;

  const signatureParts = new Map(
    params.signatureHeader.split(",").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key.trim(), rest.join("=").trim()] as const;
    }),
  );
  const t = signatureParts.get("t");
  const v1 = signatureParts.get("v1");
  if (!t || !v1) return false;

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(t));
  if (!Number.isFinite(ageSeconds) || ageSeconds > TOLERANCE_SECONDS) return false;

  const expected = createHmac("sha256", secret)
    .update(`${t}.${params.rawBody}`)
    .digest("hex");
  return timingSafeEqualHex(expected, v1);
}
