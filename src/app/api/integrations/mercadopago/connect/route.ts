import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireUserId } from "@/lib/session";
import { buildAuthorizationUrl } from "@/lib/integrations/mercadopago/client";

export async function GET() {
  await requireUserId();

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("mp_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
  });

  return NextResponse.redirect(buildAuthorizationUrl(state));
}
