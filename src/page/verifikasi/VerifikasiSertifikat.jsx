import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FaCamera, FaTimes } from 'react-icons/fa';
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
  const html5QrcodeScannerRef = useRef(null);

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

  useEffect(() => {
    if (!scanning) return;
    setErrorMsg('');
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        stream.getTracks().forEach((track) => track.stop());
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
            setErrorMsg('Gagal mengambil daftar kamera: ' + err);
            setScanning(false);
          });
      })
      .catch((err) => {
        console.log(err);
        setErrorMsg('Izin kamera ditolak atau tidak tersedia.');
        setScanning(false);
      });
    return () => stopScanner();
  }, [scanning]);

  const startHtml5Qrcode = (deviceId) => {
    const config = { fps: 15, qrbox: { width: 300, height: 300 } };
    const qrCodeSuccessCallback = (decodedText) => {
      try {
        const json = JSON.parse(decodedText);
        setInputValue({ ...defaultInput, ...json });
        setErrorMsg('');
      } catch (e) {
        console.log(e);
        setErrorMsg('QR Code tidak valid atau bukan format JSON.');
        setInputValue(defaultInput);
      } finally {
        stopScanner();
      }
    };
    const qrCodeErrorCallback = (errorMessage) => console.log('QR decode error:', errorMessage);
    html5QrcodeScannerRef.current = new Html5Qrcode('reader');
    html5QrcodeScannerRef.current
      .start(deviceId, config, qrCodeSuccessCallback, qrCodeErrorCallback)
      .catch((err) => {
        setErrorMsg('Gagal memulai scanner: ' + err);
        setScanning(false);
      });
  };

  const handleCameraChange = (e) => {
    const selectedId = e.target.value;
    setChosenCameraId(selectedId);
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current
        .stop()
        .then(() => {
          html5QrcodeScannerRef.current.clear();
          html5QrcodeScannerRef.current = null;
          startHtml5Qrcode(selectedId);
        })
        .catch((err) => setErrorMsg('Gagal ganti kamera: ' + err));
    } else {
      startHtml5Qrcode(selectedId);
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
      const response = await fetch('http://localhost:5000/api/verifikasi/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_hash: hashValue.trim() }),
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

  const handleVerifyByQR = async () => {
    setLoading(true);
    setErrorMsg('');
    setVerifikasiResult(null);
    const requiredFields = ['nim', 'nama', 'universitas', 'jurusan', 'tanggalTerbit'];
    for (let field of requiredFields) {
      if (!inputValue[field] || inputValue[field].trim() === '') {
        setErrorMsg(`Field ${field} dari QR code wajib ada!`);
        setLoading(false);
        return;
      }
    }
    const dataToSend = {};
    requiredFields.forEach((field) => (dataToSend[field] = inputValue[field].trim()));
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
              placeholder="Masukkan Hash Sertifikat"
              value={hashValue}
              onChange={(e) => setHashValue(e.target.value)}
            />
            <VerifyButton
              text="Verifikasi"
              onClick={handleVerifyByHash}
              disabled={loading || !hashValue.trim()}
              loading={loading}
            />
          </div>

          {/* Tombol Scan QR */}
          <div className="verifikasi-button-group">
            <button
              className="verifikasi-camera-btn"
              onClick={() => setScanning((prev) => !prev)}
              disabled={loading}>
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

          {/* Scanner UI */}
          {scanning && (
            <>
              {availableCameras.length > 1 && (
                <div style={{ textAlign: 'center', marginBottom: 10 }}>
                  <label htmlFor="camera-select" style={{ marginRight: 8 }}>
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
            </>
          )}

          {/* Preview Data QR */}
          {Object.values(inputValue).some((val) => val) && (
            <div className="verifikasi-preview">
              <h4>Data Sertifikat dari QR:</h4>
              <div className="verifikasi-data-table">
                <div className="verifikasi-data-row">
                  <span className="verifikasi-data-label">NIM:</span>
                  <span className="verifikasi-data-value">{inputValue.nim}</span>
                </div>
                <div className="verifikasi-data-row">
                  <span className="verifikasi-data-label">Nama:</span>
                  <span className="verifikasi-data-value">{inputValue.nama}</span>
                </div>
                <div className="verifikasi-data-row">
                  <span className="verifikasi-data-label">Universitas:</span>
                  <span className="verifikasi-data-value">{inputValue.universitas}</span>
                </div>
                <div className="verifikasi-data-row">
                  <span className="verifikasi-data-label">Jurusan:</span>
                  <span className="verifikasi-data-value">{inputValue.jurusan}</span>
                </div>
                <div className="verifikasi-data-row">
                  <span className="verifikasi-data-label">Tanggal Terbit:</span>
                  <span className="verifikasi-data-value">{inputValue.tanggalTerbit}</span>
                </div>
              </div>
              <VerifyButton
                text="Verifikasi by QR"
                onClick={handleVerifyByQR}
                disabled={loading}
                loading={loading}
              />
            </div>
          )}

          {/* Hasil Verifikasi / Error */}
          <div className="verifikasi-result">
            {errorMsg && <div className="verifikasi-error">{errorMsg}</div>}
            {!errorMsg &&
              !verifikasiResult &&
              !scanning &&
              !Object.values(inputValue).some((val) => val) && (
                <div className="verifikasi-empty">
                  Silakan scan QR code atau masukkan hash untuk verifikasi.
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
                    {/* Data Sertifikat */}
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
                    {/* Info Blok */}
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
                                {new Date(b.timestamp * 1000).toLocaleString()}
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
