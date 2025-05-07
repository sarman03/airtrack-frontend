import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const DashboardNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <h1 className="text-xl font-bold text-gray-800">AirTrack Dashboard</h1>
          </div>
          
          <div className="flex-grow flex items-center justify-center space-x-12">
            <Link 
              to="/dashboard/aqi"
              className="text-gray-600 hover:text-blue-600 font-medium"
            >
              AQI
            </Link>
            <Link 
              to="/dashboard/navigation"
              className="text-gray-600 hover:text-blue-600 font-medium"
            >
              Navigation
            </Link>
            <Link 
              to="/dashboard/heatmap"
              className="text-gray-600 hover:text-blue-600 font-medium"
            >
              Heatmap
            </Link>
            <Link 
              to="/dashboard/compare"
              className="text-gray-600 hover:text-blue-600 font-medium"
            >
              Comparison
            </Link>
          </div>

          <div className="flex-shrink-0 flex items-center">
            <button
              onClick={handleLogout}
              className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;