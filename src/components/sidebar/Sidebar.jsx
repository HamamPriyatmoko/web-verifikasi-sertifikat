import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import './Sidebar.css';

import {
  FaThLarge,
  FaListUl,
  FaCheckCircle,
  FaUserCircle,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from 'react-icons/fa';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { to: '/dashboard', icon: <FaThLarge />, text: 'Terbitkan' },
    { to: '/daftar', icon: <FaListUl />, text: 'Daftar' },
    { to: '/verifikasi', icon: <FaCheckCircle />, text: 'Verifikasi' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Tombol Hamburger hanya muncul saat sidebar tertutup */}
      {!isOpen && (
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <FaBars />
        </button>
      )}

      {/* Overlay yang akan menutup sidebar saat diklik */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-main">
          <div className="sidebar-header">
            <h1 className="sidebar-logo">B-Verify</h1>
            <button className="sidebar-close-btn" onClick={toggleSidebar}>
              <FaTimes />
            </button>
          </div>
          <div className="sidebar-nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={currentPath === link.to ? 'active' : ''}
                onClick={() => {
                  if (isOpen) toggleSidebar();
                }}>
                <span className="nav-icon">{link.icon}</span>
                {link.text}
              </Link>
            ))}
          </div>
        </div>

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
    </>
  );
};

export default Sidebar;
