import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

// Extend the default types for JWT
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
  }
}

// Extend the default types for Session and User
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string;
  }
}