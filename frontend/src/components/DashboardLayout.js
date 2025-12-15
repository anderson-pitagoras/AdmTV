import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="pt-24 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;