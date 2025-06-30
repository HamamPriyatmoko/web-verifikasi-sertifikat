import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import './Sidebar.css';

import { FaThLarge, FaListUl, FaCheckCircle, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const navLinks = [
    { to: '/dashboard', icon: <FaThLarge />, text: 'Terbitkan' },
    { to: '/daftar', icon: <FaListUl />, text: 'Daftar' },
    { to: '/verifikasi', icon: <FaCheckCircle />, text: 'Verifikasi' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  return (
    <div className="sidebar">
      {/* Bagian atas: Logo dan Navigasi */}
      <div className="sidebar-main">
        <h1 className="sidebar-logo">B-Verify</h1>
        <div className="sidebar-nav-links">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className={currentPath === link.to ? 'active' : ''}>
              <span className="nav-icon">{link.icon}</span>
              {link.text}
            </Link>
          ))}
        </div>
      </div>

      {/* Bagian bawah: Profil dan Logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <FaUserCircle className="user-icon" />
          <span className="user-name">Admin</span>
        </div>
        <button onClick={handleLogout} className="logout-button">
          <FaSignOutAlt className="logout-icon" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
