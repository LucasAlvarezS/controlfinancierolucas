"use client";

import { useState, useTransition } from "react";
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
import { createManualAccount } from "@/actions/accounts";

export function ManualAccountDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        Agregar cuenta manual
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cuenta manual</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          action={(formData) => {
            startTransition(async () => {
              await createManualAccount({
                alias: String(formData.get("alias")),
                institution: "OTHER",
                currency: "CLP",
                isSavings: formData.get("isSavings") === "on",
              });
              setOpen(false);
            });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="alias">Nombre</Label>
            <Input id="alias" name="alias" required placeholder="Ej: Efectivo, MACH" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isSavings" className="h-4 w-4" />
            Es una cuenta de ahorro
          </label>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
