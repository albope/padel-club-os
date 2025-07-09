import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

// Extend the default types for JWT
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    clubId?: string | null; // Add clubId to the JWT type
  }
}

// Extend the default types for Session and User
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      clubId?: string | null; // Add clubId to the Session User type
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string;
    clubId?: string | null; // Add clubId to the User type
  }
}