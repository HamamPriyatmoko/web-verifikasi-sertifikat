// src/App.jsx

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import semua komponen halaman Anda
import Home from './landing/home';
import Login from './page/login/Login';
import Register from './page/register/Register'; // Asumsi Anda sudah membuat ini
import MainLayout from './components/MainLayout';
import Dashboard from './page/dashboard/Dashboard';
import DaftarSertifikat from './page/daftarsertifikat/DaftarSertifikat';
import Verifikasi from './page/verifikasi/VerifikasiSertifikat';

// 1. IMPORT KOMPONEN PROTECTEDROUTE
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rute Publik (bisa diakses siapa saja) */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rute yang Dilindungi (hanya bisa diakses setelah login) */}
        <Route element={<MainLayout />}>
          <Route
            path="/dashboard"
            element={
              // 2. Bungkus halaman dengan ProtectedRoute
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/daftar"
            element={
              <ProtectedRoute>
                <DaftarSertifikat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verifikasi"
            element={
              <ProtectedRoute>
                <Verifikasi />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
