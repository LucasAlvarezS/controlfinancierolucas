"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Option {
  id: string;
  label: string;
}

/**
 * Select con label resuelto por valor. Necesario porque el value/label
 * mapping de SelectValue no se resuelve para un valor inicial (defaultValue)
 * si el SelectContent aún no fue montado/abierto una vez.
 */
export function LabeledValueSelect({
  name,
  defaultValue,
  placeholder,
  options,
  className,
  id,
}: {
  name: string;
  defaultValue?: string;
  placeholder: string;
  options: Option[];
  className?: string;
  id?: string;
}) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder}>
          {(value) =>
            typeof value === "string" ? options.find((o) => o.id === value)?.label : undefined
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
