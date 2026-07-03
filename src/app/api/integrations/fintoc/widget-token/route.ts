import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";
import { createLinkIntent } from "@/lib/integrations/fintoc/client";

export async function POST() {
  await requireUserId();

  const publicKey = process.env.FINTOC_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: "Falta FINTOC_PUBLIC_KEY" }, { status: 500 });
  }

  const { widgetToken } = await createLinkIntent();

  return NextResponse.json({ widgetToken, publicKey });
}
