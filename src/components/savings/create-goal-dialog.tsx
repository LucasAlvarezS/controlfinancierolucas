"use client";

import { useState, useTransition } from "react";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createSavingsGoal } from "@/actions/savings";

export function CreateGoalDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <IconPlus size={16} stroke={1.5} />
        Nueva meta
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva meta de ahorro</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          action={(formData) => {
            startTransition(async () => {
              await createSavingsGoal({
                name: String(formData.get("name")),
                targetAmount: Number(formData.get("targetAmount")),
                targetDate: (formData.get("targetDate") as string) || undefined,
              });
              setOpen(false);
            });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" placeholder="Ej: Viaje, Fondo de emergencia" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="targetAmount">Monto objetivo (CLP)</Label>
            <Input id="targetAmount" name="targetAmount" type="number" min={1} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="targetDate">Fecha objetivo (opcional)</Label>
            <Input id="targetDate" name="targetDate" type="date" />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
