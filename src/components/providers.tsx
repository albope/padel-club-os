'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import CookieBanner from '@/components/layout/CookieBanner';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster />
        <CookieBanner />
      </ThemeProvider>
    </SessionProvider>
  );
};

export default Providers;