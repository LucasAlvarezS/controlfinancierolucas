import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

/** Emails autorizados a iniciar sesión (coma-separados en ALLOWED_EMAILS). */
function allowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Confía en el host detrás de un proxy (Vercel/producción) para el callback.
  trustHost: true,
  // App de un solo usuario: sesión persistente de larga duración (1 año),
  // así no hay que volver a iniciar sesión constantemente.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 365 },
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    // Restringe el acceso a la(s) cuenta(s) de Google configurada(s).
    signIn: async ({ profile }) => {
      const email = profile?.email?.toLowerCase();
      if (!email || profile?.email_verified === false) return false;

      const allowlist = allowedEmails();
      // Si no se configuró allowlist, se rechaza todo por seguridad.
      if (allowlist.length === 0) return false;

      return allowlist.includes(email);
    },
    // En el primer login crea el usuario; luego persiste su id en el token.
    jwt: async ({ token, profile }) => {
      if (profile?.email) {
        const user = await prisma.user.upsert({
          where: { email: profile.email },
          update: {},
          create: { email: profile.email },
        });
        token.userId = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});
