import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions, User } from "next-auth";
import { Adapter } from "next-auth/adapters";
import { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import { compare } from "bcrypt";

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
    // GoogleProvider has been removed from this array.
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
          include: { club: { select: { name: true } } },
        });

        if (!existingUser || !existingUser.password) {
          return null;
        }

        const passwordMatch = await compare(credentials.password, existingUser.password);

        if (!passwordMatch) {
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
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.clubId = token.clubId as string | null;
        session.user.clubName = token.clubName as string | null;
        session.user.role = token.role;
      }
      return session;
    }
  }
};