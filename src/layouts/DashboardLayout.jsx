import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardNavbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;