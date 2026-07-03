import type { MpPayment } from "./client";
import type { NormalizedMovement } from "../provider.interface";

// Estados que representan plata que efectivamente se movió (o se moverá):
// rejected/cancelled/etc. no se importan.
const IMPORTABLE_STATUSES = new Set(["approved", "authorized"]);

// Operaciones internas de la propia cuenta MP (conversiones a stablecoin,
// particiones de saldo): no son ingreso ni gasto del usuario.
const INTERNAL_OPERATION_TYPES = new Set(["money_exchange", "partition_transfer"]);

function collectorId(payment: MpPayment): string {
  return String(payment.collector_id ?? payment.collector?.id ?? "");
}

/** Filtra pagos que no deben entrar como movimientos. */
export function isImportablePayment(payment: MpPayment, mpUserId: string): boolean {
  if (!IMPORTABLE_STATUSES.has(payment.status)) return false;

  const payerId = String(payment.payer?.id ?? "");
  const isInternal =
    INTERNAL_OPERATION_TYPES.has(payment.operation_type ?? "") &&
    collectorId(payment) === mpUserId &&
    (payerId === mpUserId || payerId === "");

  return !isInternal;
}

/**
 * Signo según la dirección real del dinero: si el que cobra (collector) es el
 * propio usuario, la plata entra (+); si cobra un tercero, sale (−).
 */
export function mapPaymentToMovement(
  payment: MpPayment,
  mpUserId: string,
): NormalizedMovement {
  const isIncome = collectorId(payment) === mpUserId;
  const amount = Math.abs(payment.transaction_amount);

  return {
    externalId: String(payment.id),
    amount: isIncome ? amount : -amount,
    currency: payment.currency_id,
    description: payment.description ?? "Pago Mercado Pago",
    merchantRaw: payment.description ?? undefined,
    date: new Date(payment.date_approved ?? payment.date_created),
    raw: payment,
  };
}
