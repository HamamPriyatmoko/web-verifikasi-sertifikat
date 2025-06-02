import { useState } from 'react';
import { FaCamera } from 'react-icons/fa';
// import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const [hash, setHash] = useState('');
  // const navigate = useNavigate();

  return (
    <div id="home-page" className="home-wrapper">
      {/* Navbar */}
      <div className="home-navbar">
        <h1 className="home-site-title">Web Sertifikat</h1>
        {/* <button className="home-sign-in" onClick={() => navigate('/login')}>
          Sign In
        </button> */}
      </div>

      <div className="home-main-content">
        {/* Header */}
        <h1 className="home-title">Verifikasi Sertifikat</h1>

        {/* Input Hash */}
        <div className="home-input-group">
          <input type="text" className="home-input-box" placeholder="Hash Sertifikat" value={hash} onChange={(e) => setHash(e.target.value)} />
          <button className="home-verify-btn">Verifikasi</button>
        </div>

        {/* Upload Buttons */}
        <div className="home-button-group">
          <button className="home-select-btn">Select Images</button>
          <button className="home-camera-btn">
            <FaCamera size={24} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="home-footer">
        <p>Sistem verifikasi sertifikat berbasis blockchain untuk keamanan dan transparansi.</p>
        <p>&copy; 2025 Blockchain Certificate | Semua Hak Dilindungi</p>
      </footer>
    </div>
  );
}

export default Home;
