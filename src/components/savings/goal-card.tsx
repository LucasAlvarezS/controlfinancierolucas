"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconTrash } from "@tabler/icons-react";
import { contributeManualToGoal, deleteSavingsGoal } from "@/actions/savings";

function formatCLP(amount: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function GoalCard({
  goal,
}: {
  goal: { id: string; name: string; targetAmount: number; currentAmount: number };
}) {
  const [isPending, startTransition] = useTransition();
  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{goal.name}</CardTitle>
        <Button
          size="icon"
          variant="ghost"
          disabled={isPending}
          onClick={() => startTransition(() => deleteSavingsGoal(goal.id))}
        >
          <IconTrash size={14} stroke={1.5} />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Progress value={Math.min(progress, 100)} />
        <p className="text-sm text-muted-foreground">
          {formatCLP(goal.currentAmount)} de {formatCLP(goal.targetAmount)} (
          {progress.toFixed(0)}%)
        </p>
        <form
          className="flex gap-2"
          action={(formData) => {
            const amount = Number(formData.get("amount"));
            startTransition(async () => {
              await contributeManualToGoal(goal.id, amount);
            });
          }}
        >
          <Input
            name="amount"
            type="number"
            min={1}
            placeholder="Aporte manual"
            className="h-8"
            required
          />
          <Button type="submit" size="sm" disabled={isPending}>
            Aportar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
