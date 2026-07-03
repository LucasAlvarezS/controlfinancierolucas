import type { NextRequest } from "next/server";

export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const header = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  return Boolean(expected) && header === `Bearer ${expected}`;
}
