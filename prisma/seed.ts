import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEFAULT_CATEGORIES, DEFAULT_RULES } from "../src/lib/categorization/default-rules";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categoryIdByName = new Map<string, string>();

  for (const cat of DEFAULT_CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { id: `default-${cat.name}` },
      update: { icon: cat.icon, color: cat.color },
      create: {
        id: `default-${cat.name}`,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        isDefault: true,
        userId: null,
      },
    });
    categoryIdByName.set(cat.name, created.id);
  }

  for (const rule of DEFAULT_RULES) {
    const categoryId = categoryIdByName.get(rule.category);
    if (!categoryId) continue;

    const id = `default-rule-${rule.pattern}`;
    await prisma.categorizationRule.upsert({
      where: { id },
      update: {},
      create: {
        id,
        userId: null,
        matchType: "CONTAINS",
        pattern: rule.pattern,
        categoryId,
        priority: 0,
        source: "SYSTEM_DEFAULT",
      },
    });
  }

  console.log(
    `Seed completo: ${DEFAULT_CATEGORIES.length} categorias, ${DEFAULT_RULES.length} reglas.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
