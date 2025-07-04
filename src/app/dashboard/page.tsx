import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { User } from 'next-auth';

// This is a Server Component. Its main job is to fetch data and protect the route.
const DashboardPage = async () => {
  const session = await getServerSession(authOptions);

  // If there's no session or user, redirect to login. This is our security layer.
  if (!session || !session.user) {
    redirect('/login');
  }

  // We pass the user data to a Client Component, which will handle the UI and interactions.
  // This is a more robust pattern that avoids client-side rendering issues.
  return <DashboardClient user={session.user} />;
};

export default DashboardPage;