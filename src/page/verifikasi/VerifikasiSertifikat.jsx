import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FaCamera, FaTimes } from 'react-icons/fa';
import './VerifikasiSertifikat.css';
import VerifyButton from '../../components/ButtonVerify/ButtonVerify';

const defaultInput = {
  id: '',
  nama: '',
  universitas: '',
  jurusan: '',
  sertifikatToefl: '',
  sertifikatBTA: '',
  sertifikatSKP: '',
  tanggal: '',
  valid: '',
};

function Verifikasi() {
  const [hashValue, setHashValue] = useState('');
  const [inputValue, setInputValue] = useState(defaultInput);
  const [verifikasiResult, setVerifikasiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]); // Daftar kamera
  const [chosenCameraId, setChosenCameraId] = useState(''); // Kamera terpilih
  const html5QrcodeScannerRef = useRef(null);

  // Fungsi untuk menghentikan scanner
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

  // Ketika scanning di-toggle, kita cek izin & get list kamera
  useEffect(() => {
    if (!scanning) return;

    setErrorMsg('');

    // 1) Minta izin kamera (tanpa langsung memulai Html5Qrcode)
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        // Matikan track stream agar nanti Html5Qrcode bisa pakai
        stream.getTracks().forEach((track) => track.stop());

        // 2) Ambil daftar kamera yang ada
        Html5Qrcode.getCameras()
          .then((devices) => {
            if (devices && devices.length) {
              setAvailableCameras(devices);
              // 3) Pilih kamera default: coba cari camera "back"
              const backCamera = devices.find((d) => /back|rear|environment/i.test(d.label));
              if (backCamera) {
                setChosenCameraId(backCamera.id);
                startHtml5Qrcode(backCamera.id);
              } else {
                // Jika tidak ada label "back", pakai kamera pertama
                setChosenCameraId(devices[0].id);
                startHtml5Qrcode(devices[0].id);
              }
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
        // User menolak atau tidak punya kamera
        setErrorMsg('Izin kamera ditolak atau tidak tersedia.');
        setScanning(false);
      });

    // Cleanup: hentikan scanner bila component unmount atau scanning false
    return () => {
      stopScanner();
    };
  }, [scanning]);

  // Fungsi untuk memulai Html5Qrcode dengan deviceId tertentu
  const startHtml5Qrcode = (deviceId) => {
    const config = { fps: 15, qrbox: { width: 300, height: 300 } };

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
      try {
        console.log(decodedResult);
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

    const qrCodeErrorCallback = (errorMessage) => {
      console.log('QR decode error:', errorMessage);
    };

    html5QrcodeScannerRef.current = new Html5Qrcode('reader');

    html5QrcodeScannerRef.current
      .start(deviceId, config, qrCodeSuccessCallback, qrCodeErrorCallback)
      .catch((err) => {
        setErrorMsg('Gagal memulai scanner: ' + err);
        setScanning(false);
      });
  };

  // Ketika user ingin ganti kamera (jika kita menyediakan pilihan)
  const handleCameraChange = (e) => {
    const selectedId = e.target.value;
    setChosenCameraId(selectedId);
    // Jika sudah ada instance scanner berjalan, hentikan dulu
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current
        .stop()
        .then(() => {
          html5QrcodeScannerRef.current.clear();
          html5QrcodeScannerRef.current = null;
          // Mulai ulang scanner dengan kamera baru
          startHtml5Qrcode(selectedId);
        })
        .catch((err) => {
          setErrorMsg('Gagal ganti kamera: ' + err);
        });
    } else {
      // Jika belum, langsung mulai dengan kamera baru
      startHtml5Qrcode(selectedId);
    }
  };

  // Fungsi untuk Verifikasi by Hash (sama seperti sebelumnya)
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

  // Fungsi untuk Verifikasi by QR (sama seperti sebelumnya)
  const handleVerifyByQR = async () => {
    setLoading(true);
    setErrorMsg('');
    setVerifikasiResult(null);

    const requiredFields = [
      'id',
      'nama',
      'universitas',
      'jurusan',
      'sertifikatToefl',
      'sertifikatBTA',
      'sertifikatSKP',
      'tanggal',
    ];

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
      const response = await fetch('http://localhost:5000/verifikasi_admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
      const data = await response.json();

      if (response.ok) {
        setVerifikasiResult(data);
        setShowModal(true);
        console.log(verifikasiResult);
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
    setVerifikasiResult(null);
  };

  return (
    <div className="verifikasi-container">
      <div className="verifikasi-main-content">
        <div className="verifikasi-content">
          <h1 className="verifikasi-title">VERIFIKASI SERTIFIKAT</h1>

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

          {/* Jika scanner aktif, tampilkan UI-nya */}
          {scanning && (
            <>
              {/* Jika tersedia >1 kamera, tampilkan dropdown agar user bisa pilih */}
              {availableCameras.length > 1 && (
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                  <label htmlFor="camera-select" style={{ marginRight: '8px' }}>
                    Pilih Kamera:
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
                  <span className="scanner-line"></span>
                </div>
              </div>
            </>
          )}

          {/* Preview data JSON dari QR */}
          {inputValue &&
            typeof inputValue === 'object' &&
            Object.values(inputValue).some((val) => val) && (
              <div className="verifikasi-preview">
                <h4>Data Sertifikat dari QR:</h4>
                <div className="verifikasi-data-table">
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
                    <span className="verifikasi-data-value">
                      {inputValue.sertifikatToefl || '-'}
                    </span>
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
                    <span className="verifikasi-data-value">
                      {inputValue.valid ? 'True' : 'False'}
                    </span>
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

          {/* Area hasil verifikasi atau error */}
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

          {/* Modal hasil verifikasi */}
          {showModal && verifikasiResult && (
            <div className="verifikasi-modal-overlay">
              <div className="verifikasi-modal">
                <h3>Hasil Verifikasi</h3>
                <div className="verifikasi-modal-content">
                  <div className="verifikasi-data-table">
                    {/* Informasi Sertifikat */}
                    <div className="verifikasi-data-row">
                      <span className="verifikasi-data-label">Nama:</span>
                      <span className="verifikasi-data-value">
                        {verifikasiResult.hash_data.nama || '-'}
                      </span>
                    </div>
                    <div className="verifikasi-data-row">
                      <span className="verifikasi-data-label">Universitas:</span>
                      <span className="verifikasi-data-value">
                        {verifikasiResult.hash_data.universitas || '-'}
                      </span>
                    </div>
                    <div className="verifikasi-data-row">
                      <span className="verifikasi-data-label">Jurusan:</span>
                      <span className="verifikasi-data-value">
                        {verifikasiResult.hash_data.jurusan || '-'}
                      </span>
                    </div>
                    <div className="verifikasi-data-row">
                      <span className="verifikasi-data-label">Sertifikat TOEFL:</span>
                      <span className="verifikasi-data-value">
                        {verifikasiResult.hash_data.sertifikatToefl || '-'}
                      </span>
                    </div>
                    <div className="verifikasi-data-row">
                      <span className="verifikasi-data-label">Sertifikat BTA:</span>
                      <span className="verifikasi-data-value">
                        {verifikasiResult.hash_data.sertifikatBTA || '-'}
                      </span>
                    </div>
                    <div className="verifikasi-data-row">
                      <span className="verifikasi-data-label">Sertifikat SKP:</span>
                      <span className="verifikasi-data-value">
                        {verifikasiResult.hash_data.sertifikatSKP || '-'}
                      </span>
                    </div>
                    <div className="verifikasi-data-row">
                      <span className="verifikasi-data-label">Tanggal:</span>
                      <span className="verifikasi-data-value">
                        {verifikasiResult.hash_data.tanggal || '-'}
                      </span>
                    </div>

                    {/* Informasi Blockchain */}
                    {verifikasiResult.blockchain_block && (
                      <>
                        <h4>Info Blok di Blockchain</h4>
                        <div className="verifikasi-data-row">
                          <span className="verifikasi-data-label">Nomor Blok:</span>
                          <span className="verifikasi-data-value">
                            {verifikasiResult.blockchain_block.number}
                          </span>
                        </div>
                        <div className="verifikasi-data-row">
                          <span className="verifikasi-data-label">Hash Blok:</span>
                          <span className="verifikasi-data-value">
                            {verifikasiResult.blockchain_block.hash}
                          </span>
                        </div>
                        <div className="verifikasi-data-row">
                          <span className="verifikasi-data-label">Parent Hash:</span>
                          <span className="verifikasi-data-value">
                            {verifikasiResult.blockchain_block.parentHash}
                          </span>
                        </div>
                        <div className="verifikasi-data-row">
                          <span className="verifikasi-data-label">Timestamp:</span>
                          <span className="verifikasi-data-value">
                            {new Date(
                              verifikasiResult.blockchain_block.timestamp * 1000,
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="verifikasi-data-row">
                          <span className="verifikasi-data-label">Jumlah Transaksi:</span>
                          <span className="verifikasi-data-value">
                            {verifikasiResult.blockchain_block.transactions_count}
                          </span>
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
