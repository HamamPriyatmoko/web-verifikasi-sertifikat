import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Home from './landing/home';
import Login from './page/login/Login';
import Register from './page/register/Register';
import MainLayout from './components/MainLayout';
import Dashboard from './page/dashboard/Dashboard';
import DaftarSertifikat from './page/daftarsertifikat/DaftarSertifikat';
import Verifikasi from './page/verifikasi/VerifikasiSertifikat';
import HasilVerifikasi from './page/hasilverifikasi/HasilVerifikasi';
import ForgotPassword from './page/forgot-password/ForgotPassword';
import ResetPassword from './page/reset-password/ResetPassword';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rute Publik (bisa diakses siapa saja) */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify/:hash" element={<HasilVerifikasi />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

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
