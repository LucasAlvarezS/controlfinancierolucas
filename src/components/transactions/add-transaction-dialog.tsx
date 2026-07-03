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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryIcon } from "@/components/categories/category-icon";
import { createManualTransaction } from "@/actions/transactions";

interface Option {
  id: string;
  label: string;
  icon?: string | null;
  color?: string | null;
}

export function AddTransactionDialog({
  accounts,
  categories,
}: {
  accounts: Option[];
  categories: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <IconPlus size={16} stroke={1.5} />
        Agregar gasto
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo gasto</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          action={(formData) => {
            startTransition(async () => {
              const amountInput = Number(formData.get("amount"));
              await createManualTransaction({
                financialAccountId: String(formData.get("financialAccountId")),
                amount: -Math.abs(amountInput),
                description: String(formData.get("description")),
                date: String(formData.get("date")),
                categoryId: (formData.get("categoryId") as string) || undefined,
              });
              setOpen(false);
            });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" name="description" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Monto (CLP)</Label>
            <Input id="amount" name="amount" type="number" min={1} step={1} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="financialAccountId">Cuenta</Label>
            <Select name="financialAccountId" required>
              <SelectTrigger id="financialAccountId">
                <SelectValue placeholder="Elegí una cuenta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="categoryId">Categoría (opcional)</Label>
            <Select name="categoryId">
              <SelectTrigger id="categoryId">
                <SelectValue placeholder="Se sugiere automáticamente" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <CategoryIcon icon={category.icon} color={category.color} size={15} />
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
