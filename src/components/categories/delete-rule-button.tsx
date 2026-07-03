"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { IconTrash } from "@tabler/icons-react";
import { deleteRule } from "@/actions/rules";

export function DeleteRuleButton({ ruleId }: { ruleId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      size="icon"
      variant="ghost"
      disabled={isPending}
      onClick={() => startTransition(() => deleteRule(ruleId))}
    >
      <IconTrash size={14} stroke={1.5} />
    </Button>
  );
}
