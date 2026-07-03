import { createHmac } from "crypto";
import { timingSafeEqualHex } from "@/lib/encryption";

// Tolerancia contra replay: la notificación debe ser reciente.
const TOLERANCE_SECONDS = 5 * 60;

/**
 * Valida la firma `x-signature` de una notificación de Mercado Pago
 * (formato `ts=<unix>,v1=<hmac hex>`), según "Validar origen de la
 * notificación" de su documentación: HMAC-SHA256 del manifest
 * `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` con la firma secreta
 * del panel de webhooks (las secciones sin valor se omiten).
 *
 * Si `MERCADOPAGO_WEBHOOK_SECRET` no está configurada se rechaza todo.
 */
export function verifyMercadoPagoWebhook(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !params.xSignature) return false;

  const signatureParts = new Map(
    params.xSignature.split(",").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key.trim(), rest.join("=").trim()] as const;
    }),
  );
  const ts = signatureParts.get("ts");
  const v1 = signatureParts.get("v1");
  if (!ts || !v1) return false;

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(ageSeconds) || ageSeconds > TOLERANCE_SECONDS) return false;

  const sections: string[] = [];
  // MP pide data.id en minúsculas cuando es alfanumérico.
  if (params.dataId) sections.push(`id:${params.dataId.toLowerCase()};`);
  if (params.xRequestId) sections.push(`request-id:${params.xRequestId};`);
  sections.push(`ts:${ts};`);
  const manifest = sections.join("");

  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  return timingSafeEqualHex(expected, v1);
}
