import React from 'react';

// This is the main layout for the entire authenticated section.
// It's kept simple to ensure stability.

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="bg-gray-900 min-h-screen text-white">
      {/* We will add the Sidebar and Header back here later, once the core is stable */}
      <div className="p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;