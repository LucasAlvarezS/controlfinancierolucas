import { IconBrandGoogleFilled } from "@tabler/icons-react";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  async function loginWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm rounded-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Control Financiero</CardTitle>
          <CardDescription>Tus finanzas, en un solo lugar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginWithGoogle}>
            <Button type="submit" className="w-full gap-2" size="lg">
              <IconBrandGoogleFilled size={18} stroke={1.5} />
              Continuar con Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
