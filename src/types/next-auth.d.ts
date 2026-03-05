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
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string;
    clubId?: string | null;
    clubName?: string | null;
    role?: UserRole;
    mustResetPassword?: boolean;
  }
}
