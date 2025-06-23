import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  FaCamera,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFileUpload,
  FaFilePdf,
} from 'react-icons/fa';
import './Home.css';

const docList = { key: 'cidSertifikatToefl', label: 'Sertifikat TOEFL' };

function Home() {
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // State untuk menyimpan data preview dari PDF yang di-upload
  const [pdfPreviewData, setPdfPreviewData] = useState(null);

  const html5QrcodeScannerRef = useRef(null);
  // Ref untuk input file yang tersembunyi, agar bisa di-trigger oleh tombol
  const fileInputRef = useRef(null);

  // Fungsi verifikasi utama (via HASH)
  const handleVerifyByHash = async (hashToVerify) => {
    if (!hashToVerify) {
      setResult({ status: 'invalid', message: 'Hash tidak boleh kosong.' });
      setShowModal(true);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`http://localhost:5000/api/verifikasi/hash`, {
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
      setShowModal(true);
    }
  };

  // Fungsi untuk verifikasi final dari data preview PDF
  const handleVerifyFromPreview = async () => {
    if (!pdfPreviewData) return;

    setLoading(true);
    setResult(null);

    try {
      // Panggil endpoint '/api/verifikasi' dengan seluruh metadata dari preview
      const response = await fetch(`http://localhost:5000/api/verifikasi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfPreviewData),
      });
      const data = await response.json();
      setResult(data); // Hasil final verifikasi
    } catch (error) {
      setResult({ status: 'invalid', message: 'Gagal verifikasi data. ' + error.message });
    } finally {
      setLoading(false);
      setShowModal(true); // Tampilkan modal dengan hasil akhir
      setPdfPreviewData(null); // Bersihkan preview setelah verifikasi
    }
  };

  // Fungsi untuk upload dan ekstrak PDF
  const handlePdfUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setResult({ status: 'invalid', message: 'Format file tidak valid. Harap unggah file PDF.' });
      setShowModal(true);
      return;
    }

    setLoading(true);
    setPdfPreviewData(null);
    setResult(null);

    const formData = new FormData();
    formData.append('pdfFile', file);

    try {
      // Panggil endpoint '/api/extract-pdf' untuk mendapatkan preview data
      const response = await fetch(`http://localhost:5000/api/extract-pdf`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengekstrak data dari PDF.');
      }

      setPdfPreviewData(data); // Simpan data ke state preview
    } catch (error) {
      setResult({ status: 'invalid', message: error.message });
      setShowModal(true);
    } finally {
      setLoading(false);
      // Reset input file agar bisa upload file yang sama lagi
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Fungsi untuk trigger klik pada input file
  const handlePdfButtonClick = () => {
    fileInputRef.current.click();
  };

  // Handler untuk form input manual
  const handleVerifyByInputForm = (e) => {
    e.preventDefault();
    handleVerifyByHash(inputValue);
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
          // Asumsi QR code berisi URL verifikasi atau JSON dengan hash
          // Kita coba handle keduanya
          let hashToVerify = '';
          try {
            // Coba parsing sebagai JSON
            const qrData = JSON.parse(decodedText);
            if (qrData.hashMetadata) {
              hashToVerify = qrData.hashMetadata;
            } else {
              throw new Error(); // Lanjut ke catch
            }
          } catch (e) {
            console.log(e);
            // Jika bukan JSON atau tidak ada hashMetadata, anggap sebagai URL atau hash biasa
            // Contoh: https://domain.com/verify/hash-nya-disini
            const urlParts = decodedText.split('/');
            hashToVerify = urlParts[urlParts.length - 1]; // Ambil bagian terakhir
          }

          if (hashToVerify) {
            setInputValue(hashToVerify);
            handleVerifyByHash(hashToVerify);
          } else {
            throw new Error('Format QR code tidak valid.');
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

  // Handler untuk membatalkan preview PDF
  const cancelPdfPreview = () => {
    setPdfPreviewData(null);
  };

  // Kondisi disable untuk form utama
  const isFormDisabled = loading || isScanning || pdfPreviewData;

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
            Verify Your Certificate With QrCode, PDF, Or Digital Signature
          </p>

          {/* HANYA TAMPILKAN JIKA TIDAK ADA PREVIEW PDF */}
          {!pdfPreviewData && (
            <>
              <form className="b-verify__input-group" onSubmit={handleVerifyByInputForm}>
                <input
                  type="text"
                  className="b-verify__input"
                  placeholder="Masukkan tanda tangan digital (hash)..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isFormDisabled}
                />
                <button type="submit" className="b-verify__button" disabled={isFormDisabled}>
                  Verify
                </button>
              </form>

              <div className="b-verify__actions">
                <button
                  className="b-verify__button b-verify__button--primary"
                  onClick={() => setIsScanning((prev) => !prev)}
                  disabled={isFormDisabled}>
                  <FaCamera style={{ marginRight: '8px' }} />
                  {isScanning ? 'Stop Scan' : 'Scan QR Code'}
                </button>
                {/* --- TOMBOL BARU UNTUK UPLOAD PDF --- */}
                <button
                  className="b-verify__button b-verify__button--secondary"
                  onClick={handlePdfButtonClick}
                  disabled={isFormDisabled}>
                  <FaFileUpload style={{ marginRight: '8px' }} />
                  Verify with PDF
                </button>
                {/* Input file tersembunyi */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePdfUpload}
                  style={{ display: 'none' }}
                  accept=".pdf"
                />
              </div>

              {isScanning && <div id="reader-container" className="b-verify__reader" />}
            </>
          )}

          {loading && <div className="b-verify__loading-text">Verifying...</div>}

          {/* --- KARTU PREVIEW BARU --- */}
          {pdfPreviewData && !loading && (
            <div className="b-verify__preview-card">
              <div className="b-verify__preview-header">
                <FaFilePdf />
                <h4>Preview Data dari PDF</h4>
              </div>
              <div className="b-verify__data-table">
                {Object.entries(pdfPreviewData).map(([key, value]) => (
                  <div className="b-verify__data-row" key={key}>
                    <span className="b-verify__data-label">
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </span>
                    <span className="b-verify__data-value">{value}</span>
                  </div>
                ))}
              </div>
              <div className="b-verify__preview-actions">
                <button
                  className="b-verify__button b-verify__button--cancel"
                  onClick={cancelPdfPreview}>
                  Batal
                </button>
                <button
                  className="b-verify__button b-verify__button--primary"
                  onClick={handleVerifyFromPreview}>
                  Verify Now
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Hasil Verifikasi */}
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
