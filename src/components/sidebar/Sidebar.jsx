import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './Sidebar.css'; // Ganti file CSS jika perlu
import { FaUserCircle } from 'react-icons/fa';

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="sidebar">
      <div>
        <h1 className="sidebar-logo">B-Verify</h1>
        <div className="sidebar-nav-links">
          <Link to="/dashboard" className={currentPath === '/dashboard' ? 'active' : ''}>
            Terbitkan
          </Link>
          <Link to="/daftar" className={currentPath === '/daftar' ? 'active' : ''}>
            Daftar
          </Link>
          <Link to="/verifikasi" className={currentPath === '/verifikasi' ? 'active' : ''}>
            Verifikasi
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
