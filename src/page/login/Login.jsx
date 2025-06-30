import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import './AuthForm.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_URL = 'http://127.0.0.1:5000/api/auth/login';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
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
        throw new Error(data.error || 'Terjadi kesalahan saat login.');
      }
      localStorage.setItem('accessToken', data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Bagian Kiri - Branding */}
      <div className="login-branding">
        <div className="branding-content">
          <h1>B-Verify</h1>
          <p>Verifikasi sertifikat digital berbasis blockchain.</p>
        </div>
      </div>

      {/* Bagian Kanan - Form Container */}
      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Selamat Datang Kembali</h2>
          <p className="subtitle">Silakan masuk ke akun admin Anda.</p>

          <div className="input-wrapper">
            {/* Ikon untuk username */}
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
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="input-wrapper">
            {/* Ikon untuk password */}
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
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Memproses...' : 'Login'}
          </button>

          <p className="register-link">
            Belum punya akun? <Link to="/register">Daftar di sini</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
