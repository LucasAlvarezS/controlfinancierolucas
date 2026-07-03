import "dotenv/config";
import { defineConfig } from "prisma/config";

// Las migraciones/seed usan la conexión DIRECTA (Supabase: puerto 5432).
// El runtime de la app (src/lib/prisma.ts) usa DATABASE_URL, que en
// producción debe ser la conexión POOLED (Supabase pooler, puerto 6543).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
