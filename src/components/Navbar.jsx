import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token');

  const handleAuthAction = () => {
    if (isAuthenticated) {
      localStorage.removeItem('token');
      navigate('/');
    } else {
      navigate('/auth');
    }
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.6rem 2rem',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="nav-brand">
        <h1 style={{
          margin: 0,
          color: '#333',
          fontSize: '1.3rem'
        }}>
          AirTrack
        </h1>
      </div>
      
      <button 
        onClick={handleAuthAction}
        style={{
          padding: '0.3rem 1rem',
          backgroundColor: isAuthenticated ? '#dc3545' : '#007bff',
          color: '#ffffff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem'
        }}
      >
        {isAuthenticated ? 'Logout' : 'Login'}
      </button>
    </nav>
  );
};

export default Navbar;