import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddCategoryForm } from "@/components/categories/add-category-form";
import { CategoryIcon } from "@/components/categories/category-icon";
import { DeleteCategoryButton } from "@/components/categories/delete-category-button";
import { EditCategoryDialog } from "@/components/categories/edit-category-dialog";
import { DeleteRuleButton } from "@/components/categories/delete-rule-button";

const SOURCE_LABEL: Record<string, string> = {
  SYSTEM_DEFAULT: "Default",
  USER_DEFINED: "Manual",
  LEARNED: "Aprendida",
};

export default async function CategoriesPage() {
  const userId = await requireUserId();

  const [categories, rules] = await Promise.all([
    prisma.category.findMany({
      where: { OR: [{ userId }, { isDefault: true }] },
      orderBy: { name: "asc" },
    }),
    prisma.categorizationRule.findMany({
      where: { OR: [{ userId }, { userId: null }] },
      include: { category: true },
      orderBy: [{ source: "asc" }, { pattern: "asc" }],
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Categorías y reglas</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorías</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <AddCategoryForm />
          <ul className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Badge
                  variant="outline"
                  className="gap-2 py-1.5 pr-1"
                  style={{ borderColor: category.color ?? undefined }}
                >
                  <CategoryIcon
                    icon={category.icon}
                    color={category.color ?? "#94a3b8"}
                    size={14}
                  />
                  {category.name}
                  {!category.isDefault && (
                    <>
                      <EditCategoryDialog
                        categoryId={category.id}
                        name={category.name}
                        initialIcon={category.icon}
                        initialColor={category.color}
                      />
                      <DeleteCategoryButton categoryId={category.id} />
                    </>
                  )}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reglas de categorización</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <span>
                  Si el comercio <strong>{rule.matchType.toLowerCase()}</strong> &quot;
                  {rule.pattern}&quot; → {rule.category.name}
                </span>
                <span className="flex items-center gap-2">
                  <Badge variant="secondary">{SOURCE_LABEL[rule.source]}</Badge>
                  {rule.source !== "SYSTEM_DEFAULT" && (
                    <DeleteRuleButton ruleId={rule.id} />
                  )}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
