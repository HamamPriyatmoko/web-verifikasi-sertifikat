// src/components/ProtectedRoute.jsx (versi lebih canggih)

import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import library

const checkTokenValidity = (token) => {
  if (!token) {
    return false;
  }
  try {
    const decodedToken = jwtDecode(token);
    // 'exp' adalah waktu kedaluwarsa dalam format Unix Timestamp (detik)
    // Kita bandingkan dengan waktu saat ini (dalam detik)
    const currentTime = Date.now() / 1000;

    if (decodedToken.exp < currentTime) {
      // Token sudah kedaluwarsa
      localStorage.removeItem('accessToken'); // Hapus token basi
      return false;
    }

    return true; // Token valid
  } catch (error) {
    console.log(error);
    // Jika token tidak bisa di-decode, anggap tidak valid
    localStorage.removeItem('accessToken');
    return false;
  }
};

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('accessToken');
  const isTokenValid = checkTokenValidity(token);

  if (!isTokenValid) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
