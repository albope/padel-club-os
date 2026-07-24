import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import { compare } from "bcrypt";
import { crearTokenRecuperacion, crearTokenVerificacionEmail } from "./tokens";
import { enviarEmailActivacionCuenta, enviarEmailVerificacion } from "./email";
import { logger } from "./logger";
import { createHash } from "node:crypto";
import { crearRateLimiter } from "./rate-limit";
import { normalizarEmail } from "./identity";

// TTL para refresco de suscripcion en JWT (5 minutos)
const SUBSCRIPTION_REFRESH_TTL_MS = 5 * 60 * 1000;
// Las bajas y cambios de rol se reflejan como maximo en un minuto.
const IDENTITY_REFRESH_TTL_MS = 60 * 1000;
const loginLimiter = crearRateLimiter({
  maxRequests: 10,
  windowMs: 15 * 60 * 1000,
  prefix: "rl:login",
});
const verificationEmailLimiter = crearRateLimiter({
  maxRequests: 1,
  windowMs: 5 * 60 * 1000,
  prefix: "rl:login-email-verification",
});

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
        password: { label: "Password", type: "password" },
        clubSlug: { label: "Club", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = normalizarEmail(credentials.email);
        const limiterKey = createHash("sha256").update(email).digest("hex");
        if (!(await loginLimiter.verificar(limiterKey))) {
          logger.warn("AUTH_RATE_LIMIT", "Demasiados intentos de login", {
            emailHash: limiterKey.slice(0, 12),
          });
          return null;
        }

        const existingUser = await db.user.findUnique({
          where: { email },
          include: {
            club: { select: { id: true, name: true, slug: true } },
            memberships: {
              where: { status: "ACTIVE" },
              include: { club: { select: { id: true, name: true, slug: true } } },
              orderBy: { joinedAt: "asc" },
            },
          },
        });

        if (!existingUser || !existingUser.password || !existingUser.isActive) {
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

        if (!existingUser.emailVerified && existingUser.email) {
          if (await verificationEmailLimiter.verificar(limiterKey)) {
            const next = credentials.clubSlug
              ? `/club/${encodeURIComponent(credentials.clubSlug)}/login`
              : "/login";
            crearTokenVerificacionEmail(existingUser.email)
              .then((token) => enviarEmailVerificacion({
                email: existingUser.email!,
                nombre: existingUser.name,
                token,
                next,
              }))
              .catch((err) =>
                logger.error(
                  "AUTH_EMAIL_VERIFICATION",
                  "Error enviando verificacion de email en login",
                  { emailHash: limiterKey.slice(0, 12) },
                  err,
                )
              );
          }
          return null;
        }

        const requestedSlug = credentials.clubSlug?.trim() || null;
        const membership = requestedSlug
          ? existingUser.memberships.find((item) => item.club.slug === requestedSlug)
          : existingUser.memberships.find((item) => item.clubId === existingUser.clubId)
            ?? existingUser.memberships[0];

        const legacyClubMatches = Boolean(
          existingUser.club
          && (!requestedSlug || existingUser.club.slug === requestedSlug),
        );

        if (
          existingUser.role !== "SUPER_ADMIN"
          && !membership
          && !legacyClubMatches
        ) {
          return null;
        }

        const activeClub = membership?.club ?? (legacyClubMatches ? existingUser.club : null);
        const activeRole = membership?.role ?? existingUser.role;

        return {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          image: existingUser.image,
          clubId: activeClub?.id ?? existingUser.clubId,
          clubName: activeClub?.name ?? null,
          role: activeRole,
          sessionVersion: existingUser.sessionVersion,
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
        token.sessionVersion = (user as any).sessionVersion ?? 0;
        token.identityRefreshedAt = Date.now();
        token.authInvalid = false;
      }

      let impersonationInvalida = false;
      if (token.impersonationId) {
        const tokenHash = token.impersonationToken
          ? createHash("sha256").update(token.impersonationToken).digest("hex")
          : null;
        const impersonation = tokenHash
          ? await db.impersonationSession.findFirst({
              where: {
                id: token.impersonationId,
                tokenHash,
                endedAt: null,
                expiresAt: { gt: new Date() },
              },
              select: {
                actor: { select: { isActive: true, role: true } },
              },
            })
          : null;
        if (
          !impersonation
          || !impersonation.actor.isActive
          || impersonation.actor.role !== "SUPER_ADMIN"
        ) {
          impersonationInvalida = true;
        }
      }

      const ahora = Date.now();
      const refrescarIdentidad = Boolean(
        token.id
        && (
          !token.identityRefreshedAt
          || ahora - token.identityRefreshedAt >= IDENTITY_REFRESH_TTL_MS
        ),
      );

      if (refrescarIdentidad) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id },
          select: {
            id: true,
            isActive: true,
            sessionVersion: true,
            role: true,
            clubId: true,
            club: { select: { name: true } },
            memberships: {
              where: {
                status: "ACTIVE",
                ...(token.clubId ? { clubId: token.clubId } : {}),
              },
              select: {
                clubId: true,
                role: true,
                club: { select: { name: true } },
              },
              take: 1,
            },
          },
        });

        const versionValida = dbUser
          && (token.sessionVersion ?? 0) === dbUser.sessionVersion;

        if (!dbUser || !dbUser.isActive || !versionValida) {
          token.authInvalid = true;
        } else {
          const membership = dbUser.memberships[0];
          const usaLegacy = !membership && (!token.clubId || dbUser.clubId === token.clubId);

          if (membership) {
            token.clubId = membership.clubId;
            token.clubName = membership.club.name;
            token.role = membership.role;
            token.authInvalid = false;
          } else if (usaLegacy) {
            token.clubId = dbUser.clubId;
            token.clubName = dbUser.club?.name || null;
            token.role = dbUser.role;
            token.authInvalid = false;
          } else if (dbUser.role !== "SUPER_ADMIN") {
            token.authInvalid = true;
          }
        }
        token.identityRefreshedAt = ahora;
      }
      if (impersonationInvalida) token.authInvalid = true;

      // Refrescar estado de suscripcion con TTL (cada 5 min)
      const necesitaRefrescar = !token.subscriptionRefreshedAt
        || (ahora - token.subscriptionRefreshedAt) >= SUBSCRIPTION_REFRESH_TTL_MS;

      if (token.clubId && necesitaRefrescar) {
        const club = await db.club.findUnique({
          where: { id: token.clubId },
          select: { subscriptionStatus: true, trialEndsAt: true },
        });
        if (club) {
          token.subscriptionStatus = club.subscriptionStatus;
          token.trialEndsAt = club.trialEndsAt?.toISOString() ?? null;
        }
        token.subscriptionRefreshedAt = ahora;
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
        session.user.authInvalid = Boolean(token.authInvalid);
        session.user.sessionVersion = token.sessionVersion as number;
        session.user.actorId = token.actorId as string | null;
        session.user.actorName = token.actorName as string | null;
        session.user.impersonationId = token.impersonationId as string | null;
        session.user.impersonationReadOnly = Boolean(token.impersonationReadOnly);
      }
      return session;
    }
  }
};
