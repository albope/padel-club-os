import React from 'react';
import Header from '@/components/layout/Header'; // Corrected: H is now uppercase
import Sidebar from '@/components/layout/Sidebar';

// This is the main layout for the entire authenticated section.
// It combines the Sidebar, Header, and the main content area.

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;