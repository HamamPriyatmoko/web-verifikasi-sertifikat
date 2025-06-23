import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FaCamera, FaTimes, FaCheckCircle, FaExclamationTriangle, FaFilePdf } from 'react-icons/fa';
import './Home.css'; // Pastikan file CSS ini diimpor

// Daftar dokumen untuk ditampilkan di modal
const docList = { key: 'cidSertifikatToefl', label: 'Sertifikat TOEFL' };

function Home() {
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showModal, setShowModal] = useState(false); // State untuk modal
  const html5QrcodeScannerRef = useRef(null);

  // Fungsi verifikasi utama yang akan dipanggil
  const handleVerification = async (hashToVerify) => {
    if (!hashToVerify) {
      setResult({ status: 'invalid', message: 'Hash tidak boleh kosong.' });
      setShowModal(true); // Tampilkan modal error
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`http://localhost:5000/verifikasi/hash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_hash: hashToVerify.trim() }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ status: 'invalid', message: 'Gagal terhubung ke server. ' + error.message });
    } finally {
      setLoading(false);
      setShowModal(true); // Tampilkan modal setelah proses selesai
    }
  };

  // Handler untuk form input manual
  const handleVerifyByInput = (e) => {
    e.preventDefault();
    handleVerification(inputValue);
  };

  const closeModal = () => {
    setShowModal(false);
    setResult(null);
  };

  // Logika untuk scanner kamera
  useEffect(() => {
    if (isScanning) {
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      const scanner = new Html5Qrcode('reader-container');
      html5QrcodeScannerRef.current = scanner;

      const qrSuccess = (decodedText) => {
        setIsScanning(false);
        try {
          const qrData = JSON.parse(decodedText);
          if (qrData.hashMetadata) {
            setInputValue(qrData.hashMetadata);
            handleVerification(qrData.hashMetadata);
          } else {
            throw new Error('Format QR code tidak valid atau tidak mengandung hashMetadata.');
          }
        } catch (e) {
          setResult({ status: 'invalid', message: e.message || 'Gagal memproses QR code.' });
          setShowModal(true);
        }
      };

      scanner.start({ facingMode: 'environment' }, config, qrSuccess).catch((err) => {
        console.log(err);
        setResult({
          status: 'invalid',
          message: 'Gagal memulai kamera. Pastikan Anda memberi izin.',
        });
        setShowModal(true);
      });
    } else {
      if (html5QrcodeScannerRef.current && html5QrcodeScannerRef.current.isScanning) {
        html5QrcodeScannerRef.current
          .stop()
          .catch((err) => console.log('Gagal menghentikan scanner.', err));
      }
    }
  }, [isScanning]);

  return (
    <div className="b-verify">
      <nav className="b-verify__navbar">
        <div className="b-verify__brand">B-Verify</div>
        <div className="b-verify__nav-links">
          <a href="#">Home</a>
          <a href="#">About</a>
        </div>
      </nav>

      <main className="b-verify__main-content">
        <div className="b-verify__container">
          <h1 className="b-verify__title">Verify Certificate</h1>
          <p className="b-verify__subtitle">
            Verify Your Certificate With QrCode Or Digital Signature
          </p>

          <form className="b-verify__input-group" onSubmit={handleVerifyByInput}>
            <input
              type="text"
              className="b-verify__input"
              placeholder="Tanda tangan...."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading || isScanning}
            />
            <button type="submit" className="b-verify__button" disabled={loading || isScanning}>
              Verify
            </button>
          </form>

          <button
            className="b-verify__button b-verify__button--primary"
            onClick={() => setIsScanning((prev) => !prev)}
            disabled={loading}>
            <FaCamera style={{ marginRight: '8px' }} />
            {isScanning ? 'Stop Scan' : 'Scan'}
          </button>

          {isScanning && <div id="reader-container" className="b-verify__reader" />}
          {loading && <div className="b-verify__loading-text">Verifying...</div>}
        </div>
      </main>

      {/* HASIL VERIFIKASI SEKARANG DALAM BENTUK MODAL */}
      {showModal && result && (
        <div className="b-verify__modal-overlay" onClick={closeModal}>
          <div className="b-verify__modal" onClick={(e) => e.stopPropagation()}>
            <button className="b-verify__modal-close" onClick={closeModal}>
              <FaTimes />
            </button>

            <div className="b-verify__modal-header">
              {result.status === 'valid' ? (
                <FaCheckCircle className="b-verify__result-icon b-verify__result-icon--valid" />
              ) : (
                <FaExclamationTriangle className="b-verify__result-icon b-verify__result-icon--invalid" />
              )}
              <h3 className={`b-verify__modal-title status--${result.status}`}>{result.message}</h3>
            </div>

            {result.status === 'valid' && result.data_sertifikat && (
              <div className="b-verify__modal-content">
                <h4>Data Sertifikat Terverifikasi</h4>
                <div className="b-verify__data-table">
                  <div className="b-verify__data-row">
                    <span className="b-verify__data-label">Nama:</span>
                    <span className="b-verify__data-value">{result.data_sertifikat.nama}</span>
                  </div>
                  <div className="b-verify__data-row">
                    <span className="b-verify__data-label">NIM:</span>
                    <span className="b-verify__data-value">{result.data_sertifikat.nim}</span>
                  </div>
                  <div className="b-verify__data-row">
                    <span className="b-verify__data-label">Universitas:</span>
                    <span className="b-verify__data-value">
                      {result.data_sertifikat.universitas}
                    </span>
                  </div>
                  <div className="b-verify__data-row">
                    <span className="b-verify__data-label">Jurusan:</span>
                    <span className="b-verify__data-value">{result.data_sertifikat.jurusan}</span>
                  </div>
                  <div className="b-verify__data-row">
                    <span className="b-verify__data-label">Tanggal Terbit:</span>
                    <span className="b-verify__data-value">
                      {result.data_sertifikat.tanggalTerbit}
                    </span>
                  </div>
                  <div className="b-verify__data-row hash">
                    <span className="b-verify__data-label">Hash Metadata:</span>
                    <span className="b-verify__data-value">
                      {result.data_sertifikat.hashMetadata}
                    </span>
                  </div>
                </div>

                <h4>Dokumen Pendukung</h4>
                <div className="b-verify__data-table">
                  <div className="b-verify__data-row" key={docList.key}>
                    <span className="b-verify__data-label">{docList.label}:</span>
                    <span className="b-verify__data-value">
                      {result.data_sertifikat[docList.key] ? (
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${
                            result.data_sertifikat[docList.key]
                          }`}
                          target="_blank"
                          rel="noopener noreferrer">
                          Lihat Dokumen <FaFilePdf />
                        </a>
                      ) : (
                        'Tidak Tersedia'
                      )}
                    </span>
                  </div>
                </div>

                <h4>Informasi Blok</h4>
                <div className="b-verify__data-table">
                  <div className="b-verify__data-row">
                    <span className="b-verify__data-label">Nomor Blok:</span>
                    <span className="b-verify__data-value">{result.info_blok.nomorBlok}</span>
                  </div>
                  <div className="b-verify__data-row hash">
                    <span className="b-verify__data-label">Hash Blok:</span>
                    <span className="b-verify__data-value">{result.info_blok.hashBlok}</span>
                  </div>
                  <div className="b-verify__data-row hash">
                    <span className="b-verify__data-label">Parent Hash:</span>
                    <span className="b-verify__data-value">{result.info_blok.parentHash}</span>
                  </div>
                  <div className="b-verify__data-row">
                    <span className="b-verify__data-label">Timestamp:</span>
                    <span className="b-verify__data-value">
                      {new Date(result.info_blok.timestamp * 1000).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="b-verify__data-row">
                    <span className="b-verify__data-label">Transaction Count:</span>
                    <span className="b-verify__data-value">
                      {result.info_blok.transactions_count}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
