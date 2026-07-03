import type { Institution } from "@prisma/client";
import type { FintocAccount, FintocMovement } from "./client";
import type { DiscoveredAccount, NormalizedMovement } from "../provider.interface";

const INSTITUTION_BY_FINTOC_ID: Record<string, Institution> = {
  cl_banco_estado: "BANCO_ESTADO",
  cl_banco_de_chile: "BANCO_DE_CHILE",
};

/** Mapea el id de institución de Fintoc (p. ej. cl_banco_estado) al enum propio. */
export function mapInstitution(fintocInstitutionId: string): Institution {
  return INSTITUTION_BY_FINTOC_ID[fintocInstitutionId] ?? "OTHER";
}

export function mapAccountToDiscovered(
  account: FintocAccount,
  institution: Institution,
): DiscoveredAccount {
  return {
    externalId: account.id,
    alias: account.official_name ?? account.name,
    currency: account.currency,
    institution,
    balance: account.balance?.available ?? null,
  };
}

export function mapMovementToNormalized(movement: FintocMovement): NormalizedMovement {
  return {
    externalId: movement.id,
    amount: movement.amount,
    currency: movement.currency,
    description: movement.description,
    merchantRaw: movement.description,
    date: new Date(movement.transaction_date ?? movement.post_date),
    raw: movement,
  };
}
