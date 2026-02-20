import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"
import { UserRole } from "@prisma/client"

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    clubId?: string | null;
    role?: UserRole;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      clubId?: string | null;
      role?: UserRole;
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string;
    clubId?: string | null;
    role?: UserRole;
  }
}
