import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FaCamera, FaTimes } from 'react-icons/fa';
import './VerifikasiSertifikat.css';
import VerifyButton from '../../components/ButtonVerify/ButtonVerify';

const defaultInput = {
  penerima: '',
  nama: '',
  universitas: '',
  jurusan: '',
  sertifikatToefl: '',
  sertifikatBTA: '',
  sertifikatSKP: '',
  tanggal: '',
  id: '',
  valid: '',
};

function Verifikasi() {
  const [hashValue, setHashValue] = useState('');
  const [inputValue, setInputValue] = useState(defaultInput);
  const [verifikasiResult, setVerifikasiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showModal, setShowModal] = useState(false); // State for modal visibility
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    if (scanning) {
      const config = { fps: 15, qrbox: { width: 300, height: 300 } };

      const qrCodeSuccessCallback = (decodedText, decodedResult) => {
        console.log('Success - Decoded Text:', decodedText, 'Result:', decodedResult);
        try {
          const json = JSON.parse(decodedText);
          setInputValue({ ...defaultInput, ...json });
          setErrorMsg('');
        } catch (e) {
          console.error('JSON Parse Error:', e);
          setErrorMsg('QR Code tidak valid atau bukan format JSON.');
          setInputValue(defaultInput);
        } finally {
          stopScanner();
        }
      };

      const qrCodeErrorCallback = (errorMessage) => {
        console.log(errorMessage);
      };

      html5QrcodeScannerRef.current = new Html5Qrcode('reader');
      html5QrcodeScannerRef.current.start({ facingMode: 'environment' }, config, qrCodeSuccessCallback, qrCodeErrorCallback).catch((err) => {
        setErrorMsg('Gagal mengakses kamera: ' + err + '. Pastikan Anda memberikan izin kamera.');
        setScanning(false);
      });

      return () => {
        stopScanner();
      };
    }
  }, [scanning]);

  const stopScanner = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current
        .stop()
        .then(() => {
          html5QrcodeScannerRef.current.clear();
          html5QrcodeScannerRef.current = null;
          setScanning(false);
        })
        .catch((err) => {
          setErrorMsg('Gagal menghentikan scan: ' + err);
          setScanning(false);
        });
    } else {
      setScanning(false);
    }
  };

  const handleVerifyByHash = async () => {
    setLoading(true);
    setErrorMsg('');
    setVerifikasiResult(null);

    if (!hashValue.trim()) {
      setErrorMsg('Silakan masukkan hash sertifikat!');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/blockchain/sertifikat/by_hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: hashValue.trim() }),
      });
      const data = await response.json();

      if (response.ok) {
        setVerifikasiResult(data);
        setShowModal(true); // Show modal on successful verification
      } else {
        setErrorMsg(data.error || data.message || 'Verifikasi gagal');
      }
    } catch (error) {
      setErrorMsg('Terjadi kesalahan saat verifikasi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyByQR = async () => {
    setLoading(true);
    setErrorMsg('');
    setVerifikasiResult(null);

    const requiredFields = ['penerima', 'nama', 'universitas', 'jurusan', 'sertifikatToefl', 'sertifikatBTA', 'sertifikatSKP', 'tanggal'];

    for (let field of requiredFields) {
      if (!inputValue[field] || inputValue[field].trim() === '') {
        setErrorMsg(`Field ${field} dari QR code wajib ada!`);
        setLoading(false);
        return;
      }
    }

    const dataToSend = {};
    requiredFields.forEach((field) => {
      dataToSend[field] = inputValue[field].trim();
    });

    try {
      const response = await fetch('http://localhost:5000/verifikasi_sertifikat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      const data = await response.json();

      if (response.ok) {
        setVerifikasiResult(data);
        setShowModal(true); // Show modal on successful verification
      } else {
        setErrorMsg(data.error || data.message || 'Verifikasi gagal');
      }
    } catch (error) {
      setErrorMsg('Terjadi kesalahan saat verifikasi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setVerifikasiResult(null); // Clear result when closing modal
  };

  return (
    <div className="verifikasi-container">
      <div className="verifikasi-main-content">
        <div className="verifikasi-content">
          <h1 className="verifikasi-title">Verifikasi Sertifikat</h1>

          <div className="verifikasi-input-group">
            <input type="text" className="verifikasi-input-box" placeholder="Masukkan Hash Sertifikat" value={hashValue} onChange={(e) => setHashValue(e.target.value)} />
            <VerifyButton text="Verifikasi" onClick={handleVerifyByHash} disabled={loading || !hashValue.trim()} loading={loading} />
          </div>

          <div className="verifikasi-button-group">
            <button className="verifikasi-camera-btn" onClick={() => setScanning(!scanning)} disabled={loading}>
              {scanning ? (
                <>
                  <FaTimes size={24} /> Tutup Scan
                </>
              ) : (
                <>
                  <FaCamera size={24} /> Scan QR
                </>
              )}
            </button>
          </div>

          {scanning && (
            <div className="verifikasi-scanner-container">
              <div id="reader" className="verifikasi-scanner" />
              <div className="scanner-overlay">
                <span className="scanner-line"></span>
              </div>
            </div>
          )}

          {inputValue && typeof inputValue === 'object' && Object.values(inputValue).some((val) => val) && (
            <div className="verifikasi-preview">
              <h4>Data Sertifikat dari QR:</h4>
              <div className="verifikasi-data-table">
                <div className="verifikasi-data-row">
                  <span className="verifikasi-data-label">Penerima:</span>
                  <span className="verifikasi-data-value">{inputValue.penerima || '-'}</span>
                </div>
                <div className="verifikasi-data-row">
                  <span className="verifikasi-data-label">Nama:</span>
                  <span className="verifikasi-data-value">{inputValue.nama || '-'}</span>
                </div>
                <div className="verifikasi-data-row">
                  <span className="verifikasi-data-label">Universitas:</span>
                  <span className="verifikasi-data-value">{inputValue.universitas || '-'}</span>
                </div>
                <div className="verifikasi-data-row">
                  <span className="verifikasi-data-label">Jurusan:</span>
                  <span className="verifikasi-data-value">{inputValue.jurusan || '-'}</span>
                </div>
                <div className="verifikasi-data-row">
                  <span className="verifikasi-data-label">Sertifikat TOEFL:</span>
                  <span className="verifikasi-data-value">{inputValue.sertifikatToefl || '-'}</span>
                </div>
                <div className="verifikasi-data-row">
                  <span className="verifikasi-data-label">Sertifikat BTA:</span>
                  <span className="verifikasi-data-value">{inputValue.sertifikatBTA || '-'}</span>
                </div>
                <div className="verifikasi-data-row">
                  <span className="verifikasi-data-label">Sertifikat SKP:</span>
                  <span className="verifikasi-data-value">{inputValue.sertifikatSKP || '-'}</span>
                </div>
                <div className="verifikasi-data-row">
                  <span className="verifikasi-data-label">Tanggal:</span>
                  <span className="verifikasi-data-value">{inputValue.tanggal || '-'}</span>
                </div>
                <div className="verifikasi-data-row">
                  <span className="verifikasi-data-label">ID:</span>
                  <span className="verifikasi-data-value">{inputValue.id || '-'}</span>
                </div>
                <div className="verifikasi-data-row">
                  <span className="verifikasi-data-label">Valid:</span>
                  <span className="verifikasi-data-value">{inputValue.valid ? 'True' : 'False'}</span>
                </div>
              </div>
              <VerifyButton text="Verifikasi by QR" onClick={handleVerifyByQR} disabled={loading} loading={loading} />
            </div>
          )}

          <div className="verifikasi-result">
            {errorMsg && <div className="verifikasi-error">{errorMsg}</div>}
            {!errorMsg && !verifikasiResult && !scanning && !Object.values(inputValue).some((val) => val) && <div className="verifikasi-empty">Silakan scan QR code atau masukkan hash untuk verifikasi.</div>}
          </div>

          {/* Modal for Verification Result */}
          {/* Modal for Verification Result */}
          {showModal && verifikasiResult && (
            <div className="verifikasi-modal-overlay">
              <div className="verifikasi-modal">
                <h3>Hasil Verifikasi</h3>
                <div className="verifikasi-modal-content">
                  <div className="verifikasi-data-table">
                    {/* Data Sertifikat */}
                    <div className="verifikasi-data-row">
                      <span className="verifikasi-data-label">Penerima:</span>
                      <span className="verifikasi-data-value">{verifikasiResult.data.penerima || '-'}</span>
                    </div>
                    <div className="verifikasi-data-row">
                      <span className="verifikasi-data-label">Nama:</span>
                      <span className="verifikasi-data-value">{verifikasiResult.data.nama || '-'}</span>
                    </div>
                    <div className="verifikasi-data-row">
                      <span className="verifikasi-data-label">Universitas:</span>
                      <span className="verifikasi-data-value">{verifikasiResult.data.universitas || '-'}</span>
                    </div>
                    <div className="verifikasi-data-row">
                      <span className="verifikasi-data-label">Jurusan:</span>
                      <span className="verifikasi-data-value">{verifikasiResult.data.jurusan || '-'}</span>
                    </div>
                    <div className="verifikasi-data-row">
                      <span className="verifikasi-data-label">Sertifikat TOEFL:</span>
                      <span className="verifikasi-data-value">{verifikasiResult.data.sertifikatToefl || '-'}</span>
                    </div>
                    <div className="verifikasi-data-row">
                      <span className="verifikasi-data-label">Sertifikat BTA:</span>
                      <span className="verifikasi-data-value">{verifikasiResult.data.sertifikatBTA || '-'}</span>
                    </div>
                    <div className="verifikasi-data-row">
                      <span className="verifikasi-data-label">Sertifikat SKP:</span>
                      <span className="verifikasi-data-value">{verifikasiResult.data.sertifikatSKP || '-'}</span>
                    </div>
                    <div className="verifikasi-data-row">
                      <span className="verifikasi-data-label">Tanggal:</span>
                      <span className="verifikasi-data-value">{verifikasiResult.data.tanggal || '-'}</span>
                    </div>
                    <div className="verifikasi-data-row">
                      <span className="verifikasi-data-label">Hash Blockchain:</span>
                      <span className="verifikasi-data-value">{verifikasiResult.hashBlockchain || '-'}</span>
                    </div>
                    <div className="verifikasi-data-row">
                      <span className="verifikasi-data-label">Status:</span>
                      <span className="verifikasi-data-value">{verifikasiResult.message || '-'}</span>
                    </div>

                    {/* Blockchain Block Info */}
                    {verifikasiResult.blockchain_block && (
                      <>
                        <h4 style={{ marginTop: '1rem' }}>Info Blok di Blockchain</h4>
                        <div className="verifikasi-data-row">
                          <span className="verifikasi-data-label">Nomor Blok:</span>
                          <span className="verifikasi-data-value">{verifikasiResult.blockchain_block.number}</span>
                        </div>
                        <div className="verifikasi-data-row">
                          <span className="verifikasi-data-label">Hash Blok:</span>
                          <span className="verifikasi-data-value">{verifikasiResult.blockchain_block.hash}</span>
                        </div>
                        <div className="verifikasi-data-row">
                          <span className="verifikasi-data-label">Parent Hash:</span>
                          <span className="verifikasi-data-value">{verifikasiResult.blockchain_block.parentHash}</span>
                        </div>
                        <div className="verifikasi-data-row">
                          <span className="verifikasi-data-label">Timestamp:</span>
                          <span className="verifikasi-data-value">{new Date(verifikasiResult.blockchain_block.timestamp * 1000).toLocaleString()}</span>
                        </div>
                        <div className="verifikasi-data-row">
                          <span className="verifikasi-data-label">Jumlah Transaksi:</span>
                          <span className="verifikasi-data-value">{verifikasiResult.blockchain_block.transactions_count}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <button className="verifikasi-modal-close-btn" onClick={closeModal}>
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Verifikasi;
