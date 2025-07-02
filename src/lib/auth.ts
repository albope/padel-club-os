import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions, User, Session } from "next-auth";
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
    error: "/auth/error", // <-- AÑADIDO: Le decimos a NextAuth que use nuestra página de error
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
        // Los console.log se mantienen aquí. Si no aparecen en la TERMINAL,
        // significa que la función authorize no se está ejecutando.
        console.log("[AUTHORIZE_START] Intentando autorizar con:", { email: credentials?.email });

        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTHORIZE_FAIL] Faltan credenciales.");
          return null;
        }

        const existingUser = await db.user.findUnique({
          where: { email: credentials.email }
        });

        if (!existingUser) {
          console.log(`[AUTHORIZE_FAIL] Usuario no encontrado para el email: ${credentials.email}`);
          return null;
        }
        
        if (!existingUser.password) {
            console.log("[AUTHORIZE_FAIL] El usuario existe pero no tiene contraseña (¿inicio de sesión social?).");
            return null;
        }

        console.log("[AUTHORIZE_DEBUG] Comparando contraseñas...");
        const passwordMatch = await compare(credentials.password, existingUser.password);
        console.log(`[AUTHORIZE_DEBUG] ¿Las contraseñas coinciden?: ${passwordMatch}`);

        if (!passwordMatch) {
          console.log("[AUTHORIZE_FAIL] La contraseña no coincide.");
          return null;
        }

        console.log("[AUTHORIZE_SUCCESS] Usuario autenticado correctamente.");
        return {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return { ...token, id: user.id };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: { ...session.user, id: token.id },
      };
    }
  }
};
