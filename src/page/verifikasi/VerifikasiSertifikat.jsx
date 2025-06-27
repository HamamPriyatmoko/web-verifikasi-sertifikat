// src/components/VerifikasiSertifikat.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FaCamera, FaTimes, FaFileUpload, FaFilePdf } from 'react-icons/fa';
import './VerifikasiSertifikat.css';
import VerifyButton from '../../components/ButtonVerify/ButtonVerify';

// Gateway IPFS untuk download dokumen
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export default function VerifikasiSertifikat() {
  const [hashValue, setHashValue] = useState('');
  const [verifikasiResult, setVerifikasiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (scanning) {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (!devices.length) throw new Error('Tidak ada kamera');
          startScanner(devices[0].id);
        })
        .catch((err) => {
          setErrorMsg('Gagal akses kamera: ' + err.message);
          setScanning(false);
        });
    }
    return () => stopScanner();
  }, [scanning]);

  const startScanner = (deviceId) => {
    const qr = new Html5Qrcode('reader-container');
    scannerRef.current = qr;
    qr.start(
      { deviceId: { exact: deviceId } },
      { fps: 10, qrbox: { width: 300, height: 300 } },
      (decoded) => {
        stopScanner();
        let hash = decoded.startsWith('http')
          ? decoded.split('/').pop()
          : (() => {
              try {
                return JSON.parse(decoded).hashMetadata;
              } catch {
                return '';
              }
            })();
        if (hash) handleVerifyByHash(hash);
        else setErrorMsg('Konten QR tidak valid');
      },
    ).catch((err) => {
      setErrorMsg('Gagal memulai scanner: ' + err.message);
      setScanning(false);
    });
  };

  const stopScanner = () => {
    const qr = scannerRef.current;
    if (qr && qr.isScanning) qr.stop().catch(() => {});
    setScanning(false);
  };

  const handleVerifyByHash = async (hash) => {
    setLoading(true);
    setErrorMsg('');
    setVerifikasiResult(null);
    if (!hash) {
      setErrorMsg('Masukkan hash sertifikat');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/verifikasi/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_hash: hash.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verifikasi gagal');
      setVerifikasiResult(data);
      setShowModal(true);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      setErrorMsg('Unggah PDF');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const fd = new FormData();
    fd.append('pdfFile', file);
    try {
      const res = await fetch('http://localhost:5000/api/extract-pdf', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ekstraksi gagal');
      setPdfPreview(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
      fileInputRef.current.value = null;
    }
  };

  const handleVerifyPdf = async () => {
    if (!pdfPreview.nim || !pdfPreview.universitas || !pdfPreview.nomerSertifikat) {
      setErrorMsg('Data PDF tidak lengkap');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('http://localhost:5000/api/admin/verifikasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfPreview),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Verifikasi gagal');
      setVerifikasiResult(data);
      setShowModal(true);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
      setPdfPreview(null);
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
              className="verifikasi-input-box"
              placeholder="Masukkan tanda tangan digital (hash)..."
              value={hashValue}
              onChange={(e) => setHashValue(e.target.value)}
              disabled={loading || scanning}
            />
            <VerifyButton
              text="Verifikasi"
              onClick={() => handleVerifyByHash(hashValue)}
              disabled={loading || !hashValue.trim()}
              loading={loading}
            />
          </div>

          <div className="verifikasi-button-group">
            <button
              className="verifikasi-camera-btn"
              onClick={() => setScanning((v) => !v)}
              disabled={loading}>
              {scanning ? <FaTimes /> : <FaCamera />} {scanning ? 'Stop Scan' : 'Scan QR'}
            </button>
            <button
              className="verifikasi-pdf-btn"
              onClick={() => fileInputRef.current.click()}
              disabled={loading}>
              <FaFileUpload /> Verifikasi via PDF
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handlePdfUpload}
              accept=".pdf"
            />
          </div>

          {scanning && (
            <div className="verifikasi-scanner-wrapper">
              <div className="verifikasi-scanner-container">
                <div id="reader-container" className="verifikasi-scanner" />
                <div className="scanner-overlay">
                  <span className="scanner-line" />
                </div>
              </div>
            </div>
          )}

          {pdfPreview && (
            <div className="verifikasi-preview">
              <h4>Preview Data dari PDF</h4>
              <div className="verifikasi-data-table">
                {Object.entries(pdfPreview).map(([k, v]) => (
                  <div className="verifikasi-data-row" key={k}>
                    <span className="verifikasi-data-label">{k}:</span>
                    <span className="verifikasi-data-value">{v}</span>
                  </div>
                ))}
              </div>
              <div className="verifikasi-preview-actions">
                <button className="verifikasi-cancel-btn" onClick={() => setPdfPreview(null)}>
                  Batal
                </button>
                <VerifyButton
                  text="Verify Now"
                  onClick={handleVerifyPdf}
                  loading={loading}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="verifikasi-result">
            {errorMsg && <div className="verifikasi-error">{errorMsg}</div>}
            {!errorMsg && !verifikasiResult && !scanning && !pdfPreview && (
              <div className="verifikasi-empty">
                Silakan scan QR code, unggah PDF, atau masukkan hash untuk verifikasi.
              </div>
            )}
          </div>

          {showModal && verifikasiResult && (
            <div className="verifikasi-modal-overlay">
              <div className="verifikasi-modal">
                <h3 className={`status--${verifikasiResult.status}`}>{verifikasiResult.message}</h3>

                {verifikasiResult.data && (
                  <>
                    <h4>Data Sertifikat</h4>
                    <div className="verifikasi-data-table">
                      <div className="verifikasi-data-row">
                        <span className="verifikasi-data-label">NIM:</span>
                        <span className="verifikasi-data-value">{verifikasiResult.data.nim}</span>
                      </div>
                      <div className="verifikasi-data-row">
                        <span className="verifikasi-data-label">Universitas:</span>
                        <span className="verifikasi-data-value">
                          {verifikasiResult.data.universitas}
                        </span>
                      </div>
                      <div className="verifikasi-data-row">
                        <span className="verifikasi-data-label">Hash Metadata:</span>
                        <span className="verifikasi-data-value">
                          {verifikasiResult.data.hashMetadata}
                        </span>
                      </div>
                      <div className="verifikasi-data-row">
                        <span className="verifikasi-data-label">Jurusan:</span>
                        <span className="verifikasi-data-value">
                          {verifikasiResult.data.jurusan}
                        </span>
                      </div>
                      <div className="verifikasi-data-row">
                        <span className="verifikasi-data-label">Fakultas:</span>
                        <span className="verifikasi-data-value">
                          {verifikasiResult.data.fakultas}
                        </span>
                      </div>
                      <div className="verifikasi-data-row">
                        <span className="verifikasi-data-label">Tahun Lulus:</span>
                        <span className="verifikasi-data-value">
                          {verifikasiResult.data.tahunLulus}
                        </span>
                      </div>
                      <div className="verifikasi-data-row">
                        <span className="verifikasi-data-label">Nama:</span>
                        <span className="verifikasi-data-value">{verifikasiResult.data.nama}</span>
                      </div>
                      <div className="verifikasi-data-row">
                        <span className="verifikasi-data-label">Nomor Sertifikat:</span>
                        <span className="verifikasi-data-value">
                          {verifikasiResult.data.nomerSertifikat}
                        </span>
                      </div>
                      <div className="verifikasi-data-row">
                        <span className="verifikasi-data-label">CID Detail:</span>
                        <span className="verifikasi-data-value">
                          {verifikasiResult.data.cidDetail}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {verifikasiResult.info_blok && (
                  <>
                    <h4>Info Blok</h4>
                    <div className="verifikasi-data-table">
                      <div className="verifikasi-data-row">
                        <span className="verifikasi-data-label">Nomor Blok:</span>
                        <span className="verifikasi-data-value">
                          {verifikasiResult.info_blok.nomorBlok}
                        </span>
                      </div>
                      <div className="verifikasi-data-row">
                        <span className="verifikasi-data-label">Hash Blok:</span>
                        <span className="verifikasi-data-value">
                          {verifikasiResult.info_blok.hashBlok}
                        </span>
                      </div>
                      <div className="verifikasi-data-row">
                        <span className="verifikasi-data-label">Parent Hash:</span>
                        <span className="verifikasi-data-value">
                          {verifikasiResult.info_blok.parentHash}
                        </span>
                      </div>
                      <div className="verifikasi-data-row">
                        <span className="verifikasi-data-label">Timestamp:</span>
                        <span className="verifikasi-data-value">
                          {new Date(verifikasiResult.info_blok.timestamp * 1000).toLocaleString(
                            'id-ID',
                          )}
                        </span>
                      </div>
                      <div className="verifikasi-data-row">
                        <span className="verifikasi-data-label">Transactions Count:</span>
                        <span className="verifikasi-data-value">
                          {verifikasiResult.info_blok.transactions_count}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Tombol Download PDF Ijazah & SKPI berdasarkan CID dan path */}
                {verifikasiResult.data && verifikasiResult.data.cidDetail && (
                  <>
                    <h4>Download Dokumen</h4>
                    <div className="verifikasi-download-group">
                      {/* Path disimpan di metadata as pathIjazah dan pathSkpi */}
                      <button
                        className="verifikasi-download-btn"
                        onClick={() =>
                          window.open(
                            `${IPFS_GATEWAY}${
                              verifikasiResult.data.cidDetail
                            }/${verifikasiResult.data.pathIjazah.replace('./', '')}`,
                            '_blank',
                          )
                        }>
                        <FaFilePdf style={{ marginRight: 6 }} /> Ijazah
                      </button>
                      <button
                        className="verifikasi-download-btn"
                        onClick={() =>
                          window.open(
                            `${IPFS_GATEWAY}${
                              verifikasiResult.data.cidDetail
                            }/${verifikasiResult.data.pathSkpi.replace('./', '')}`,
                            '_blank',
                          )
                        }>
                        <FaFilePdf style={{ marginRight: 6 }} /> SKPI
                      </button>
                    </div>
                  </>
                )}

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
