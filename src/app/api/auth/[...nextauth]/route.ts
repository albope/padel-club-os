import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth/next";

// This handler connects NextAuth to Next.js and exposes all the
// necessary API routes like /api/auth/signin, /api/auth/session, etc.
const handler = NextAuth(authOptions);

// Export the handler for both GET and POST methods using a more explicit syntax
// to be compatible with all Next.js versions.
export const GET = handler;
export const POST = handler;
