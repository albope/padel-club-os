import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions, User } from "next-auth";
import { Adapter } from "next-auth/adapters";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
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
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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
          where: { email: credentials.email }
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
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign in, add user properties to the token
      if (user) {
        token.id = user.id;
        token.clubId = (user as any).clubId;
      }

      // --- NEW LOGIC ---
      // On subsequent requests, if clubId is missing from the token,
      // try to fetch it from the database.
      if (token.id && !token.clubId) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id },
        });
        if (dbUser?.clubId) {
          token.clubId = dbUser.clubId;
        }
      }
      // --- END OF NEW LOGIC ---

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.clubId = token.clubId as string | null;
      }
      return session;
    }
  }
};