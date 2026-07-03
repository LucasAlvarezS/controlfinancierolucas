import type { MpPayment } from "./client";
import type { NormalizedMovement } from "../provider.interface";

export function mapPaymentToMovement(payment: MpPayment): NormalizedMovement {
  const isApproved = payment.status === "approved";
  const signedAmount = isApproved
    ? -Math.abs(payment.transaction_amount)
    : payment.transaction_amount;

  return {
    externalId: String(payment.id),
    amount: signedAmount,
    currency: payment.currency_id,
    description: payment.description ?? "Pago Mercado Pago",
    merchantRaw: payment.description ?? undefined,
    date: new Date(payment.date_approved ?? payment.date_created),
    raw: payment,
  };
}
