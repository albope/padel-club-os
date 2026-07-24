import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"
import { UserRole } from "@prisma/client"

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    clubId?: string | null;
    clubName?: string | null;
    role?: UserRole;
    mustResetPassword?: boolean;
    subscriptionStatus?: string | null;
    trialEndsAt?: string | null;
    subscriptionRefreshedAt?: number;
    sessionVersion?: number;
    identityRefreshedAt?: number;
    authInvalid?: boolean;
    actorId?: string | null;
    actorName?: string | null;
    impersonationId?: string | null;
    impersonationReadOnly?: boolean;
    impersonationToken?: string | null;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      clubId?: string | null;
      clubName?: string | null;
      role?: UserRole;
      mustResetPassword?: boolean;
      subscriptionStatus?: string | null;
      trialEndsAt?: string | null;
      sessionVersion?: number;
      authInvalid?: boolean;
      actorId?: string | null;
      actorName?: string | null;
      impersonationId?: string | null;
      impersonationReadOnly?: boolean;
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string;
    clubId?: string | null;
    clubName?: string | null;
    role?: UserRole;
    mustResetPassword?: boolean;
    sessionVersion?: number;
  }
}
