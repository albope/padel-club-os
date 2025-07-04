'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

// This component wraps our entire application with the NextAuth SessionProvider,
// making session data available to all client components.

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return <SessionProvider>{children}</SessionProvider>;
};

export default Providers;