import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FintocConnectButton } from "@/components/accounts/fintoc-connect-button";
import { ManualAccountDialog } from "@/components/accounts/manual-account-dialog";

export default function NewAccountPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Conectar cuenta</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mercado Pago</CardTitle>
            <CardDescription>
              Sincroniza tus movimientos automáticamente vía OAuth.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              nativeButton={false}
              render={<a href="/api/integrations/mercadopago/connect" />}
            >
              Conectar Mercado Pago
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">BancoEstado</CardTitle>
            <CardDescription>
              Sincronización automática de movimientos vía Fintoc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FintocConnectButton institution="BANCO_ESTADO" label="Conectar BancoEstado" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Banco de Chile · Cuenta FAN</CardTitle>
            <CardDescription>
              Sincronización automática vía Fintoc. Se recomienda marcarla como cuenta
              de ahorro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FintocConnectButton
              institution="BANCO_DE_CHILE"
              label="Conectar Banco de Chile"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cuenta manual</CardTitle>
            <CardDescription>
              Para efectivo u otras cuentas sin sincronización automática todavía.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ManualAccountDialog />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
