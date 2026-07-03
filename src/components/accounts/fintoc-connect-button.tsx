"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Widget hospedado de Fintoc: https://docs.fintoc.com/docs/web-integration.
// El script expone el objeto global `Fintoc`; el onSuccess recibe el link
// intent con un exchangeToken que el backend canjea por el link_token.
interface FintocLinkIntent {
  exchangeToken: string;
}

interface FintocWidget {
  open: () => void;
  destroy: () => void;
}

declare global {
  interface Window {
    Fintoc?: {
      create: (options: {
        publicKey: string;
        widgetToken: string;
        institutionId?: string;
        onSuccess: (linkIntent: FintocLinkIntent) => void;
        onExit?: () => void;
      }) => FintocWidget;
    };
  }
}

const SCRIPT_SRC = "https://js.fintoc.com/v1/";

const FINTOC_INSTITUTION_ID: Record<string, string> = {
  BANCO_ESTADO: "cl_banco_estado",
  BANCO_DE_CHILE: "cl_banco_de_chile",
};

function loadFintocScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Fintoc) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar el widget de Fintoc"));
    document.body.appendChild(script);
  });
}

export function FintocConnectButton({
  institution,
  label,
}: {
  institution: "BANCO_ESTADO" | "BANCO_DE_CHILE";
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleConnect() {
    setLoading(true);
    try {
      const response = await fetch("/api/integrations/fintoc/widget-token", {
        method: "POST",
      });
      if (!response.ok) throw new Error("No se pudo crear el link intent");
      const { widgetToken, publicKey } = await response.json();

      await loadFintocScript();
      const widget = window.Fintoc?.create({
        publicKey,
        widgetToken,
        institutionId: FINTOC_INSTITUTION_ID[institution],
        onSuccess: async (linkIntent) => {
          await fetch("/api/integrations/fintoc/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ exchangeToken: linkIntent.exchangeToken }),
          });
          router.push("/accounts");
          router.refresh();
        },
        onExit: () => setLoading(false),
      });
      widget?.open();
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleConnect} disabled={loading} variant="secondary">
      {loading ? "Abriendo..." : label}
    </Button>
  );
}
