import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import '../login/AuthForm.css';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const navigate = useNavigate();

  // URL ke API backend Anda. Sesuaikan jika perlu.
  const API_URL = 'http://127.0.0.1:5000/api/auth/register';

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validasi frontend: pastikan password cocok
    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
      return; // Hentikan proses jika tidak cocok
    }

    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat registrasi.');
      }

      // Jika registrasi berhasil
      setSuccessMessage('Registrasi berhasil! Anda akan dialihkan ke halaman login...');

      // Tunggu 3 detik sebelum mengalihkan pengguna, agar pesan bisa terbaca
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {' '}
      {/* Menggunakan class yang sama dari AuthForm.css */}
      <div className="login-branding">
        <div className="branding-content">
          <h1>B-Verify</h1>
          <p>Autentikasi sertifikat digital berbasis blockchain.</p>
        </div>
      </div>
      {/* Bagian Kanan - Form Container */}
      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Buat Akun Baru</h2>
          <p className="subtitle">Lengkapi data untuk mendaftar sebagai admin.</p>

          {/* Input untuk Username */}
          <div className="input-wrapper">
            <svg
              className="input-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor">
              <path d="M12 2.5a5.5 5.5 0 0 1 5.5 5.5c0 1.571-.67 3.003-1.755 4.022C13.62 14.133 12.01 15.5 12 15.5s-1.62-1.367-3.745-3.478C7.17 11.003 6.5 9.57 6.5 8a5.5 5.5 0 0 1 5.5-5.5zm0 3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM19.528 17.437A20.35 20.35 0 0 0 12 16.5a20.35 20.35 0 0 0-7.528.937A6.5 6.5 0 0 1 12 14a6.5 6.5 0 0 1 7.528 3.437z"></path>
            </svg>
            <input
              type="text"
              id="username"
              placeholder="Pilih username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Input untuk Password */}
          <div className="input-wrapper">
            <svg
              className="input-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor">
              <path d="M18 8h-1V6A5 5 0 0 0 7 6v2H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3zM9 6a3 3 0 0 1 6 0v2H9V6zm9 14H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1z"></path>
            </svg>
            <input
              type="password"
              id="password"
              placeholder="Buat password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Input untuk Konfirmasi Password */}
          <div className="input-wrapper">
            <svg
              className="input-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor">
              <path d="M18 8h-1V6A5 5 0 0 0 7 6v2H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3zM9 6a3 3 0 0 1 6 0v2H9V6zm9 14H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1z"></path>
            </svg>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Konfirmasi password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {error && <p className="login-error">{error}</p>}
          {successMessage && <p className="login-success">{successMessage}</p>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Memproses...' : 'Daftar'}
          </button>

          <p className="register-link">
            Sudah punya akun? <Link to="/login">Masuk di sini</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
