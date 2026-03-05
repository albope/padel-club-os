import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import { compare } from "bcrypt";
import { crearTokenRecuperacion } from "./tokens";
import { enviarEmailActivacionCuenta } from "./email";
import { logger } from "./logger";

// Rate limiter por email para auto-envio de activacion (max 1 email cada 5 minutos por usuario)
const activacionEmailTimestamps = new Map<string, number>();
function puedeEnviarActivacion(email: string): boolean {
  const ahora = Date.now();
  const ultimo = activacionEmailTimestamps.get(email);
  if (ultimo && ahora - ultimo < 5 * 60 * 1000) return false;
  activacionEmailTimestamps.set(email, ahora);
  // Limpieza periodica para evitar memory leak
  if (activacionEmailTimestamps.size > 1000) {
    for (const [key, ts] of activacionEmailTimestamps) {
      if (ahora - ts > 10 * 60 * 1000) activacionEmailTimestamps.delete(key);
    }
  }
  return true;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const existingUser = await db.user.findUnique({
          where: { email: credentials.email },
          include: { club: { select: { name: true, slug: true } } },
        });

        if (!existingUser || !existingUser.password) {
          return null;
        }

        const passwordMatch = await compare(credentials.password, existingUser.password);

        if (!passwordMatch) {
          return null;
        }

        // Si el usuario necesita resetear password, auto-enviar email de activacion
        // y bloquear el login (retornar null)
        if (existingUser.mustResetPassword) {
          if (existingUser.email && existingUser.club?.slug && existingUser.club?.name) {
            if (puedeEnviarActivacion(existingUser.email)) {
              crearTokenRecuperacion(existingUser.email)
                .then((token) =>
                  enviarEmailActivacionCuenta({
                    email: existingUser.email!,
                    token,
                    nombre: existingUser.name,
                    clubNombre: existingUser.club!.name,
                    clubSlug: existingUser.club!.slug,
                  })
                )
                .catch((err) =>
                  logger.error("AUTH_ACTIVACION", "Error enviando email de activacion en login", { email: existingUser.email }, err)
                );
            }
          }
          return null;
        }

        return {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          image: existingUser.image,
          clubId: existingUser.clubId,
          clubName: existingUser.club?.name || null,
          role: existingUser.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.clubId = (user as any).clubId;
        token.clubName = (user as any).clubName;
        token.role = (user as any).role;
      }
      if (token.id && !token.clubId) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id },
          include: { club: { select: { name: true } } },
        });
        if (dbUser) {
          token.clubId = dbUser.clubId;
          token.clubName = dbUser.club?.name || null;
          token.role = dbUser.role;
        }
      }
      // Refrescar estado de suscripcion periodicamente (cada request de JWT)
      if (token.clubId) {
        const club = await db.club.findUnique({
          where: { id: token.clubId },
          select: { subscriptionStatus: true, trialEndsAt: true },
        });
        if (club) {
          token.subscriptionStatus = club.subscriptionStatus;
          token.trialEndsAt = club.trialEndsAt?.toISOString() ?? null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.clubId = token.clubId as string | null;
        session.user.clubName = token.clubName as string | null;
        session.user.role = token.role;
        session.user.subscriptionStatus = token.subscriptionStatus as string | null;
        session.user.trialEndsAt = token.trialEndsAt as string | null;
      }
      return session;
    }
  }
};
