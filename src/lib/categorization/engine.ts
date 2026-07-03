import type { PrismaClient, RuleMatchType } from "@prisma/client";

const SOURCE_PRIORITY: Record<string, number> = {
  LEARNED: 3,
  USER_DEFINED: 2,
  SYSTEM_DEFAULT: 1,
};

export function normalizeMerchant(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function matches(matchType: RuleMatchType, pattern: string, value: string): boolean {
  switch (matchType) {
    case "EQUALS":
      return value === pattern;
    case "CONTAINS":
      return value.includes(pattern);
    case "REGEX":
      try {
        return new RegExp(pattern).test(value);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

/**
 * Devuelve el categoryId de la primera regla que matchea, evaluando
 * primero las reglas aprendidas del usuario, luego las definidas por el
 * usuario, y por último las reglas default del sistema.
 */
export async function categorizeTransaction(
  prisma: PrismaClient,
  params: { userId: string; merchantNormalized: string },
): Promise<string | null> {
  const rules = await prisma.categorizationRule.findMany({
    where: {
      OR: [{ userId: params.userId }, { userId: null }],
    },
  });

  const sorted = rules.sort((a, b) => {
    const sourceDiff = SOURCE_PRIORITY[b.source] - SOURCE_PRIORITY[a.source];
    if (sourceDiff !== 0) return sourceDiff;
    return b.priority - a.priority;
  });

  for (const rule of sorted) {
    if (matches(rule.matchType, rule.pattern, params.merchantNormalized)) {
      return rule.categoryId;
    }
  }

  return null;
}

/**
 * Registra la corrección manual de una categoría como regla aprendida,
 * para que futuras transacciones del mismo comercio se categoricen igual.
 */
export async function learnFromCorrection(
  prisma: PrismaClient,
  params: { userId: string; merchantNormalized: string; categoryId: string },
) {
  const existing = await prisma.categorizationRule.findFirst({
    where: {
      userId: params.userId,
      source: "LEARNED",
      matchType: "EQUALS",
      pattern: params.merchantNormalized,
    },
  });

  if (existing) {
    return prisma.categorizationRule.update({
      where: { id: existing.id },
      data: { categoryId: params.categoryId },
    });
  }

  return prisma.categorizationRule.create({
    data: {
      userId: params.userId,
      source: "LEARNED",
      matchType: "EQUALS",
      pattern: params.merchantNormalized,
      categoryId: params.categoryId,
      priority: 100,
    },
  });
}
