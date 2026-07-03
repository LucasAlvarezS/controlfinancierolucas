import type { NextRequest } from "next/server";
import { timingSafeEqualString } from "@/lib/encryption";

export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const header = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected || !header) return false;
  return timingSafeEqualString(header, `Bearer ${expected}`);
}
