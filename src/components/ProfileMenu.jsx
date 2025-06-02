import React, { useState, useRef, useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './ProfileMenu.css';

const ProfileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    console.log('Logout...');
    // Kosongkan session jika perlu
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="profile-menu" ref={menuRef}>
      <FaUserCircle className="profile-icon" onClick={toggleMenu} />
      {isOpen && (
        <div className="profile-dropdown">
          <span onClick={() => navigate('/profile')}>Lihat Profil</span>
          <span onClick={handleLogout}>Logout</span>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
