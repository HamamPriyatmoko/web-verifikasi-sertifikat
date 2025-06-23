import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FaCamera, FaTimes, FaFileUpload } from 'react-icons/fa';
import './VerifikasiSertifikat.css';
import VerifyButton from '../../components/ButtonVerify/ButtonVerify';

const defaultInput = {
  nim: '',
  nama: '',
  universitas: '',
  jurusan: '',
  tanggalTerbit: '',
};

const docList = [
  { key: 'cidSuratBebasPerpustakaan', label: 'Surat Perpustakaan' },
  { key: 'cidSuratBebasLaboratorium', label: 'Surat Laboratorium' },
  { key: 'cidSuratBebasKeuangan', label: 'Surat Bebas Keuangan' },
  { key: 'cidBuktiPenyerahanSkripsi', label: 'Bukti Penyerahan Skripsi' },
  { key: 'cidSertifikatToefl', label: 'Sertifikat TOEFL' },
];

function Verifikasi() {
  const [hashValue, setHashValue] = useState('');
  const [inputValue, setInputValue] = useState(defaultInput);
  const [verifikasiResult, setVerifikasiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [chosenCameraId, setChosenCameraId] = useState('');

  const [pdfPreviewData, setPdfPreviewData] = useState(null);

  const html5QrcodeScannerRef = useRef(null);
  const fileInputRef = useRef(null);

  const stopScanner = () => {
    if (html5QrcodeScannerRef.current && html5QrcodeScannerRef.current.isScanning) {
      html5QrcodeScannerRef.current
        .stop()
        .then(() => {
          setScanning(false);
        })
        .catch((err) => {
          console.error('Gagal menghentikan scan: ', err);
          setScanning(false);
        });
    } else {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (scanning) {
      setErrorMsg('');
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length) {
            setAvailableCameras(devices);
            const backCamera = devices.find((d) => /back|rear|environment/i.test(d.label));
            const deviceId = backCamera ? backCamera.id : devices[0].id;
            setChosenCameraId(deviceId);
            startHtml5Qrcode(deviceId);
          } else {
            setErrorMsg('Tidak ada kamera terdeteksi.');
            setScanning(false);
          }
        })
        .catch((err) => {
          console.log(err);
          setErrorMsg(
            'Gagal mendapatkan izin atau daftar kamera. Pastikan Anda mengizinkan akses kamera di browser.',
          );
          setScanning(false);
        });
    }

    return () => {
      if (html5QrcodeScannerRef.current && html5QrcodeScannerRef.current.isScanning) {
        stopScanner();
      }
    };
  }, [scanning]);

  // --- FUNGSI INI YANG DIUBAH ---
  const startHtml5Qrcode = (deviceId) => {
    const config = { fps: 15, qrbox: { width: 300, height: 300 } };

    const qrCodeSuccessCallback = (decodedText) => {
      stopScanner(); // Hentikan scanner segera setelah berhasil

      // Cek apakah hasil scan adalah URL
      if (decodedText.startsWith('http')) {
        try {
          // Ambil bagian terakhir dari URL sebagai hash
          const urlParts = decodedText.split('/');
          const hash = urlParts[urlParts.length - 1];

          if (hash) {
            setHashValue(hash); // Set nilai hash ke input field
            handleVerifyByHash(hash); // Langsung verifikasi menggunakan hash
          } else {
            throw new Error('URL tidak mengandung hash yang valid.');
          }
        } catch (e) {
          setErrorMsg(e.message || 'Gagal memproses URL dari QR Code.');
        }
      } else {
        // Jika bukan URL, asumsikan itu adalah JSON
        try {
          const json = JSON.parse(decodedText);
          setInputValue({ ...defaultInput, ...json }); // Mengisi form preview dari QR
          setErrorMsg('');
        } catch (e) {
          console.error(e);
          setErrorMsg('QR Code tidak valid. Isinya bukan URL atau JSON.');
          setInputValue(defaultInput);
        }
      }
    };

    html5QrcodeScannerRef.current = new Html5Qrcode('reader');
    html5QrcodeScannerRef.current
      .start({ deviceId: { exact: deviceId } }, config, qrCodeSuccessCallback)
      .catch((err) => {
        setErrorMsg('Gagal memulai scanner: ' + err);
        setScanning(false);
      });
  };

  const handleCameraChange = (e) => {
    const selectedId = e.target.value;
    setChosenCameraId(selectedId);
    stopScanner();
    setTimeout(() => startHtml5Qrcode(selectedId), 100);
  };

  const handleVerifyByHash = async (hashToVerify) => {
    // Jika hash tidak di-pass sebagai argumen, ambil dari state
    const hash = hashToVerify || hashValue;

    setLoading(true);
    setErrorMsg('');
    setVerifikasiResult(null);

    if (!hash.trim()) {
      setErrorMsg('Silakan masukkan hash sertifikat!');
      setLoading(false);
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/verifikasi/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_hash: hash.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        setVerifikasiResult(data);
        setShowModal(true);
      } else {
        setErrorMsg(data.error || data.message || 'Verifikasi gagal');
      }
    } catch (error) {
      setErrorMsg('Terjadi kesalahan saat verifikasi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyByMetadata = async (metadata) => {
    setLoading(true);
    setErrorMsg('');
    setVerifikasiResult(null);

    const requiredFields = ['nim', 'nama', 'universitas', 'jurusan', 'tanggalTerbit'];
    for (let field of requiredFields) {
      if (!metadata[field] || String(metadata[field]).trim() === '') {
        setErrorMsg(`Field '${field}' dari data wajib ada!`);
        setLoading(false);
        return;
      }
    }

    const dataToSend = {};
    requiredFields.forEach((field) => (dataToSend[field] = String(metadata[field]).trim()));

    try {
      const response = await fetch('http://localhost:5000/api/admin/verifikasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      const data = await response.json();
      if (response.ok) {
        setVerifikasiResult(data);
        setShowModal(true);
      } else {
        setErrorMsg(data.error || data.message || 'Verifikasi gagal');
      }
    } catch (error) {
      setErrorMsg('Terjadi kesalahan saat verifikasi: ' + error.message);
    } finally {
      setLoading(false);
      setPdfPreviewData(null);
      setInputValue(defaultInput);
    }
  };

  const handlePdfUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrorMsg('Format file tidak valid. Harap unggah file PDF.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setPdfPreviewData(null);

    const formData = new FormData();
    formData.append('pdfFile', file);

    try {
      const response = await fetch('http://localhost:5000/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengekstrak data dari PDF.');
      }

      setPdfPreviewData(data);
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = (cid) => {
    if (!cid) {
      setErrorMsg('CID tidak tersedia untuk download');
      return;
    }
    window.open(`https://ipfs.io/ipfs/${cid}`, '_blank');
  };

  const closeModal = () => {
    setShowModal(false);
    setVerifikasiResult(null);
  };

  const isActionDisabled = loading || scanning;

  // Render function (JSX)
  return (
    <div className="verifikasi-container">
      <div className="verifikasi-main-content">
        <div className="verifikasi-content">
          <h1 className="verifikasi-title">VERIFIKASI SERTIFIKAT</h1>

          {/* Input Hash */}
          <div className="verifikasi-input-group">
            <input
              type="text"
              className="verifikasi-input-box"
              placeholder="Masukkan tanda tangan digital (hash)..."
              value={hashValue}
              onChange={(e) => setHashValue(e.target.value)}
              disabled={isActionDisabled}
            />
            <VerifyButton
              text="Verifikasi"
              onClick={() => handleVerifyByHash()}
              disabled={isActionDisabled || !hashValue.trim()}
              loading={loading && hashValue.trim() !== ''}
            />
          </div>

          {/* Grup Tombol Aksi Utama */}
          <div className="verifikasi-button-group">
            <button
              className="verifikasi-camera-btn"
              onClick={() => setScanning((prev) => !prev)}
              disabled={isActionDisabled}>
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
            <button
              className="verifikasi-pdf-btn"
              onClick={() => fileInputRef.current.click()}
              disabled={isActionDisabled}>
              <FaFileUpload size={24} /> Verifikasi via PDF
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handlePdfUpload}
              accept=".pdf"
            />
          </div>

          {/* (Sisa dari JSX tidak berubah dan tetap sama seperti sebelumnya) */}
          {/* ... */}
          {/* Scanner UI */}
          {scanning && (
            <div className="verifikasi-scanner-wrapper">
              {availableCameras.length > 1 && (
                <div style={{ textAlign: 'center', marginBottom: 10 }}>
                  <label htmlFor="camera-select" style={{ marginRight: 8, color: '#333' }}>
                    Pilihan Kamera:
                  </label>
                  <select id="camera-select" value={chosenCameraId} onChange={handleCameraChange}>
                    {availableCameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label || cam.id}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="verifikasi-scanner-container">
                <div id="reader" className="verifikasi-scanner" />
                <div className="scanner-overlay">
                  <span className="scanner-line" />
                </div>
              </div>
            </div>
          )}

          {/* Preview Data dari QR */}
          {Object.values(inputValue).some((val) => val) && (
            <div className="verifikasi-preview">
              <h4>Data Sertifikat dari QR Code:</h4>
              <div className="verifikasi-data-table">
                <div className="verifikasi-data-row">
                  <span className="verifikasi-data-label">NIM:</span>
                  <span className="verifikasi-data-value">{inputValue.nim}</span>
                </div>
                <div className="verifikasi-data-row">
                  <span className="verifikasi-data-label">Nama:</span>
                  <span className="verifikasi-data-value">{inputValue.nama}</span>
                </div>
              </div>
              <div className="verifikasi-preview-actions">
                <button
                  className="verifikasi-cancel-btn"
                  onClick={() => setInputValue(defaultInput)}>
                  Batal
                </button>
                <VerifyButton
                  text="Verifikasi by QR"
                  onClick={() => handleVerifyByMetadata(inputValue)}
                  disabled={loading}
                  loading={loading && Object.values(inputValue).some((v) => v)}
                />
              </div>
            </div>
          )}

          {/* Preview Data dari PDF */}
          {pdfPreviewData && (
            <div className="verifikasi-preview">
              <h4>Data Sertifikat dari PDF:</h4>
              <div className="verifikasi-data-table">
                {Object.entries(pdfPreviewData).map(([key, value]) => (
                  <div className="verifikasi-data-row" key={key}>
                    <span className="verifikasi-data-label">
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </span>
                    <span className="verifikasi-data-value">{value}</span>
                  </div>
                ))}
              </div>
              <div className="verifikasi-preview-actions">
                <button className="verifikasi-cancel-btn" onClick={() => setPdfPreviewData(null)}>
                  Batal
                </button>
                <VerifyButton
                  text="Verifikasi by PDF"
                  onClick={() => handleVerifyByMetadata(pdfPreviewData)}
                  disabled={loading}
                  loading={loading && !!pdfPreviewData}
                />
              </div>
            </div>
          )}

          {/* Pesan Error / Status Awal */}
          <div className="verifikasi-result">
            {errorMsg && <div className="verifikasi-error">{errorMsg}</div>}
            {!errorMsg &&
              !verifikasiResult &&
              !scanning &&
              !pdfPreviewData &&
              !Object.values(inputValue).some((val) => val) && (
                <div className="verifikasi-empty">
                  Silakan scan QR code, unggah PDF, atau masukkan hash untuk verifikasi.
                </div>
              )}
          </div>

          {/* Modal Hasil Verifikasi */}
          {showModal && verifikasiResult && (
            <div className="verifikasi-modal-overlay">
              <div className="verifikasi-modal">
                <h3>✅ Sertifikat Ditemukan dan Terverifikasi di Blockchain</h3>
                <div className="verifikasi-modal-content">
                  <div className="verifikasi-data-table">
                    {(() => {
                      const s = verifikasiResult.data_sertifikat;
                      return (
                        <>
                          <div className="verifikasi-data-row">
                            <span className="verifikasi-data-label">NIM:</span>
                            <span className="verifikasi-data-value">{s.nim}</span>
                          </div>
                          <div className="verifikasi-data-row">
                            <span className="verifikasi-data-label">Nama:</span>
                            <span className="verifikasi-data-value">{s.nama}</span>
                          </div>
                          <div className="verifikasi-data-row">
                            <span className="verifikasi-data-label">Universitas:</span>
                            <span className="verifikasi-data-value">{s.universitas}</span>
                          </div>
                          <div className="verifikasi-data-row">
                            <span className="verifikasi-data-label">Jurusan:</span>
                            <span className="verifikasi-data-value">{s.jurusan}</span>
                          </div>
                          <div className="verifikasi-data-row">
                            <span className="verifikasi-data-label">Tanggal Terbit:</span>
                            <span className="verifikasi-data-value">{s.tanggalTerbit}</span>
                          </div>
                          <div className="verifikasi-data-row">
                            <span className="verifikasi-data-label">Tanda Tangan Digital:</span>
                            <span className="verifikasi-data-value">{s.hashMetadata}</span>
                          </div>
                        </>
                      );
                    })()}
                    {verifikasiResult.info_blok &&
                      (() => {
                        const b = verifikasiResult.info_blok;
                        return (
                          <>
                            <h4>Info Blok di Blockchain</h4>
                            <div className="verifikasi-data-row">
                              <span className="verifikasi-data-label">Nomor Blok:</span>
                              <span className="verifikasi-data-value">{b.nomorBlok}</span>
                            </div>
                            <div className="verifikasi-data-row">
                              <span className="verifikasi-data-label">Hash Blok:</span>
                              <span className="verifikasi-data-value">{b.hashBlok}</span>
                            </div>
                            <div className="verifikasi-data-row">
                              <span className="verifikasi-data-label">Parent Hash:</span>
                              <span className="verifikasi-data-value">{b.parentHash}</span>
                            </div>
                            <div className="verifikasi-data-row">
                              <span className="verifikasi-data-label">Timestamp:</span>
                              <span className="verifikasi-data-value">
                                {new Date(b.timestamp * 1000).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="verifikasi-data-row">
                              <span className="verifikasi-data-label">Jumlah Transaksi:</span>
                              <span className="verifikasi-data-value">{b.transactions_count}</span>
                            </div>
                          </>
                        );
                      })()}
                  </div>
                </div>
                <h4>Download Dokumen</h4>
                <div className="verifikasi-download-group">
                  {docList.map((doc) => {
                    const cid = verifikasiResult.data_sertifikat[doc.key];
                    return cid ? (
                      <button
                        key={doc.key}
                        className="verifikasi-download-btn"
                        onClick={() => handleDownload(cid)}>
                        {doc.label}
                      </button>
                    ) : null;
                  })}
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
