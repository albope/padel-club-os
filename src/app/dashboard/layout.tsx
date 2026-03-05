import React from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { MobileNavBar } from '@/components/layout/MobileNavBar';
import { SkipToContent } from '@/components/layout/SkipToContent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SubscriptionBanner from '@/components/facturacion/SubscriptionBanner';
import { PushNotificationPrompt } from '@/components/layout/PushNotificationPrompt';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = async ({ children }: DashboardLayoutProps) => {
  const session = await getServerSession(authOptions);
  const subscriptionStatus = session?.user?.subscriptionStatus ?? null;
  const trialEndsAt = session?.user?.trialEndsAt ?? null;

  return (
    <div className="flex h-screen bg-background text-foreground">
      <SkipToContent />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main id="contenido-principal" className="flex-1 overflow-x-hidden overflow-y-auto pb-16 md:pb-0">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <SubscriptionBanner
              subscriptionStatus={subscriptionStatus}
              trialEndsAt={trialEndsAt}
            />
            <PushNotificationPrompt />
            {children}
          </div>
        </main>
        <MobileNavBar />
      </div>
    </div>
  );
};

export default DashboardLayout;
