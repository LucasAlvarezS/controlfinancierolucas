import type { NormalizedMovement } from "../provider.interface";

// Descripciones del release_report que representan movimientos NO cubiertos por
// /v1/payments/search. Hoy: retiros / transferencias salientes de la cuenta
// (fila `payout`). Las filas `reserve_for_payout` son la reserva + liberación
// del saldo (netean cero) y se descartan.
const REPORT_IMPORTABLE_DESCRIPTIONS = new Set(["payout"]);

// El release_report de esta cuenta se emite en CLP (ver /config).
const REPORT_CURRENCY = "CLP";

/**
 * Parsea el CSV del release_report de Mercado Pago y devuelve solo los
 * movimientos que faltan en payments/search (retiros = filas `payout`).
 *
 * El CSV usa `;` como separador y una primera fila con nombres de columna; se
 * mapea por nombre (no por posición) para tolerar cambios de orden de columnas.
 * Encabezado observado:
 *   DATE;SOURCE_ID;DESCRIPTION;NET_CREDIT_AMOUNT;NET_DEBIT_AMOUNT;GROSS_AMOUNT;...
 */
export function parseReleaseReport(csv: string): NormalizedMovement[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const header = lines[0].split(";").map((column) => column.trim());
  const index = {
    date: header.indexOf("DATE"),
    sourceId: header.indexOf("SOURCE_ID"),
    description: header.indexOf("DESCRIPTION"),
    credit: header.indexOf("NET_CREDIT_AMOUNT"),
    debit: header.indexOf("NET_DEBIT_AMOUNT"),
  };
  // Si falta alguna columna clave el formato cambió: no arriesgamos datos malos.
  if (Object.values(index).some((position) => position < 0)) return [];

  const movements: NormalizedMovement[] = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(";");
    const description = (cells[index.description] ?? "").trim();
    if (!REPORT_IMPORTABLE_DESCRIPTIONS.has(description)) continue;

    // Signo por la dirección real del dinero: crédito entra (+), débito sale (−).
    const amount = parseAmount(cells[index.credit]) - parseAmount(cells[index.debit]);
    if (amount === 0) continue;

    const sourceId = (cells[index.sourceId] ?? "").trim();
    const rawDate = (cells[index.date] ?? "").trim();

    movements.push({
      // SOURCE_ID + descripción identifica el retiro de forma estable → permite
      // deduplicar entre corridas (unique financialAccountId+externalId).
      externalId: `release:${sourceId}:${description}`,
      amount,
      currency: REPORT_CURRENCY,
      description: "Retiro Mercado Pago",
      merchantRaw: description,
      date: new Date(rawDate),
      raw: Object.fromEntries(header.map((column, i) => [column, cells[i] ?? ""])),
    });
  }
  return movements;
}

/** Convierte "200000.00" → 200000; valores vacíos o no numéricos → 0. */
function parseAmount(value: string | undefined): number {
  const parsed = Number((value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}
