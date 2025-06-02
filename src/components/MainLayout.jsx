import React from 'react';
import Sidebar from './sidebar/Sidebar';
import { Outlet, useLocation } from 'react-router-dom';
import './MainLayout.css'; // Add a CSS file for MainLayout

const MainLayout = () => {
  const { pathname } = useLocation();
  console.log(pathname);

  return (
    <div className="main-layout">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
