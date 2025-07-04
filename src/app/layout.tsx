import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers"; // Import the session provider

// Configure the Inter font from Google Fonts
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Padel Club OS",
  description: "La solución definitiva para la gestión de tu club de pádel.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* The Providers component is essential for NextAuth session management */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}