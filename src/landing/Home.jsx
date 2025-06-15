import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './Home.css';

function Home() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [hash, setHash] = useState('');
  const html5QrcodeScannerRef = useRef(null);

  // --- SCAN KAMERA
  const startCameraScan = () => {
    setCameraActive(true);
    setResult(null);
    if (!html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current = new Html5Qrcode('reader');
    }
    html5QrcodeScannerRef.current.start(
      { facingMode: 'environment' },
      { fps: 15, qrbox: 300 },
      (decodedText) => {
        try {
          const data = JSON.parse(decodedText);
          console.log(data);
          stopCameraScan();
          verifikasiSertifikat(data);
        } catch (err) {
          console.log('Error parsing QR from camera:', err);
          setResult({ status: 'invalid', message: 'QR code dari kamera bukan format JSON.' });
        }
      },
      (errorMessage) => {
        console.log('Scan camera error:', errorMessage);
      },
    );
  };

  const stopCameraScan = () => {
    setCameraActive(false);
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.stop().catch((err) => {
        console.log('Stop camera error:', err);
      });
      document.getElementById('reader').innerHTML = '';
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.stop().catch((err) => {
          console.log('Cleanup camera error:', err);
        });
      }
    };
  }, []);

  // --- SCAN FILE
  const handleFileChange = async (event) => {
    setResult(null);
    setLoading(true);
    const file = event.target.files[0];
    if (!file) {
      setLoading(false);
      return;
    }
    const html5Qr = new Html5Qrcode('file-reader');
    try {
      const decodedText = await html5Qr.scanFile(file, true);
      try {
        const data = JSON.parse(decodedText);
        verifikasiSertifikat(data);
      } catch (err) {
        console.log('Error parsing QR from file:', err);
        setResult({ status: 'invalid', message: 'QR code pada file bukan format JSON.' });
      }
    } catch (scanError) {
      console.log('Scan file error:', scanError);
      setResult({ status: 'invalid', message: 'Tidak ditemukan QR code pada gambar.' });
    }
    setLoading(false);
    html5Qr.clear();
  };

  // --- VERIFIKASI HASH/ID MANUAL
  const handleVerifyManual = async (e) => {
    e.preventDefault();
    setResult(null);
    if (!hash.trim()) {
      setResult({ status: 'invalid', message: 'Hash/ID sertifikat tidak boleh kosong.' });
      console.log('Hash/ID sertifikat tidak boleh kosong.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/verifikasi_public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: hash.trim() }),
      });
      const resultData = await response.json();
      setResult(resultData);
      if (resultData.status !== 'valid') {
        console.log('Verifikasi gagal (manual input):', resultData);
      }
    } catch (err) {
      console.log('Fetch verifikasi manual error:', err);
      setResult({
        status: 'invalid',
        message: 'Gagal memverifikasi sertifikat. Backend tidak respons.',
      });
    }
    setLoading(false);
  };

  // --- VERIFIKASI OTOMATIS (SCAN)
  const verifikasiSertifikat = async (data) => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('http://localhost:5000/verifikasi_public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resultData = await response.json();
      setResult(resultData);
      if (resultData.status !== 'valid') {
        console.log('Verifikasi gagal (scan):', resultData);
      }
    } catch (err) {
      console.log('Fetch verifikasi scan error:', err);
      setResult({
        status: 'invalid',
        message: 'Gagal memverifikasi sertifikat. Backend tidak respons.',
      });
    }
    setLoading(false);
  };

  return (
    <div className="Home-page">
      <div className="Home-navbar">
        <span className="Home-site-title">🔗 Blockchain Certificate</span>
      </div>
      <div className="Home-main-content">
        <div className="Home-card-glass">
          <div className="Home-title">Verifikasi Sertifikat Blockchain</div>

          {/* Form Input Manual */}
          <form className="Home-form" autoComplete="off" onSubmit={handleVerifyManual}>
            <label className="Home-label" htmlFor="Home-hash-input">
              Masukkan Hash / ID Sertifikat:
            </label>
            <input
              id="Home-hash-input"
              type="text"
              className="Home-hash-input"
              placeholder="Contoh: a3f8b7..."
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              disabled={loading}
            />
            <button className="Home-verify-btn" type="submit" disabled={loading}>
              🔍 Verifikasi Manual
            </button>
          </form>

          <span className="Home-or-text">atau</span>
          {/* Upload File */}
          <label className="Home-label" htmlFor="Home-file-upload" style={{ marginBottom: 5 }}>
            Scan QR dari Gambar Sertifikat:
          </label>
          <input
            id="Home-file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
            className="Home-file-input"
          />
          <button
            className="Home-scan-btn"
            type="button"
            disabled={loading}
            onClick={() => document.getElementById('Home-file-upload').click()}>
            📁 Pilih File Sertifikat
          </button>

          <span className="Home-or-text">atau</span>
          {/* Scan Kamera */}
          <button
            className="Home-cam-btn"
            type="button"
            disabled={loading}
            onClick={cameraActive ? stopCameraScan : startCameraScan}>
            {cameraActive ? '🛑 Stop Kamera' : '📷 Scan dari Kamera'}
          </button>

          <div id="reader" className={`Home-reader${cameraActive ? ' active' : ''}`}></div>

          {loading && <div className="Home-loading">Memproses...</div>}

          {result && (
            <div className={`Home-alert-result${result.status === 'valid' ? '' : ' invalid'}`}>
              <div className="Home-result-message">
                <span className="Home-result-icon">{result.status === 'valid' ? '✅' : '❌'}</span>
                {result.message}
              </div>
              {/* Jika valid, tampilkan info blockchain */}
              {result.status === 'valid' && result.blockchain_block && (
                <div>
                  <div className="Home-block-section-title">Info Block pada Blockchain:</div>
                  <table className="Home-block-table">
                    <tbody>
                      <tr>
                        <th>Block Number</th>
                        <td>{result.blockchain_block.number}</td>
                      </tr>
                      <tr>
                        <th>Block Hash</th>
                        <td style={{ fontFamily: 'monospace' }}>{result.blockchain_block.hash}</td>
                      </tr>
                      <tr>
                        <th>Parent Hash</th>
                        <td style={{ fontFamily: 'monospace' }}>
                          {result.blockchain_block.parentHash}
                        </td>
                      </tr>
                      <tr>
                        <th>Timestamp</th>
                        <td>
                          {new Date(result.blockchain_block.timestamp * 1000).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <th>Tx Count</th>
                        <td>{result.blockchain_block.transactions_count}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              {result.status !== 'valid' && result.detail && (
                <pre>{JSON.stringify(result.detail, null, 2)}</pre>
              )}
            </div>
          )}
        </div>
      </div>
      <footer className="Home-footer">
        Sistem verifikasi sertifikat berbasis blockchain untuk keamanan dan transparansi.
        <br />
        &copy; 2025 Blockchain Certificate | Semua Hak Dilindungi
      </footer>
    </div>
  );
}

export default Home;
  