import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import '../login/AuthForm.css'; // Menggunakan CSS yang sama

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_URL = `${import.meta.env.VITE_API_BASE}/api/auth/forgot-password`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');

    const toastId = toast.loading('Memproses permintaan...');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan.');
      }

      toast.success('Permintaan terkirim!', { id: toastId });
      setMessage(data.message); // Menampilkan pesan dari API
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Toaster position="top-right" />
      <div className="login-branding">
        <div className="branding-content">
          <h1>B-Verify</h1>
          <p>Autentikasi sertifikat digital berbasis blockchain.</p>
        </div>
      </div>
      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Lupa Password</h2>
          <p className="subtitle">Masukkan email Anda untuk menerima instruksi reset password.</p>

          <div className="input-wrapper">
            <svg
              className="input-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor">
              <path d="M2.5 4A1.5 1.5 0 0 1 4 2.5h16A1.5 1.5 0 0 1 21.5 4v.516l-8.62 6.033a1.5 1.5 0 0 1-1.76 0L2.5 4.516V4zm0 2.651l8.223 5.756a3.5 3.5 0 0 0 4.114 0L21.5 6.65V18.5a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18.5v-11.85z"></path>
            </svg>
            <input
              type="email"
              id="email"
              placeholder="Email terdaftar"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {message && <p className="login-success">{message}</p>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Mengirim...' : 'Kirim Instruksi'}
          </button>

          <p className="register-link">
            Ingat password Anda? <Link to="/login">Kembali ke Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
