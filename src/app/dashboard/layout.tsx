import React from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { MobileNavBar } from '@/components/layout/MobileNavBar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import SubscriptionBanner from '@/components/facturacion/SubscriptionBanner';
import { PushNotificationPrompt } from '@/components/layout/PushNotificationPrompt';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = async ({ children }: DashboardLayoutProps) => {
  const session = await getServerSession(authOptions);
  let subscriptionStatus: string | null = null;
  let trialEndsAt: string | null = null;

  if (session?.user?.clubId) {
    const club = await db.club.findUnique({
      where: { id: session.user.clubId },
      select: { subscriptionStatus: true, trialEndsAt: true },
    });
    subscriptionStatus = club?.subscriptionStatus ?? null;
    trialEndsAt = club?.trialEndsAt?.toISOString() ?? null;
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto pb-16 md:pb-0">
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
