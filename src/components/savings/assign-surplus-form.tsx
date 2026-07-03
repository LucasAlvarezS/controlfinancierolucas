"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignSurplusToGoal } from "@/actions/savings";

export function AssignSurplusForm({
  surplus,
  goals,
}: {
  surplus: number;
  goals: { id: string; name: string }[];
}) {
  const [isPending, startTransition] = useTransition();

  if (goals.length === 0 || surplus <= 0) return null;

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      action={(formData) => {
        const goalId = String(formData.get("goalId"));
        startTransition(async () => {
          await assignSurplusToGoal(goalId, surplus);
        });
      }}
    >
      <Select name="goalId" required>
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Asignar excedente a..." />
        </SelectTrigger>
        <SelectContent>
          {goals.map((goal) => (
            <SelectItem key={goal.id} value={goal.id}>
              {goal.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" disabled={isPending}>
        Asignar excedente
      </Button>
    </form>
  );
}
