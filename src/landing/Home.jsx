// src/components/Home.js
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

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fileInputRef = useRef();
  const scannerRef = useRef();

  // 1) Verifikasi by hash
  const verifyHash = async (hash) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/verifikasi/hash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_hash: hash }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ status: 'invalid', message: 'Gagal koneksi: ' + e.message });
    } finally {
      setLoading(false);
      setShowModal(true);
    }
  };

  // 2) Upload & ekstrak PDF
  const onPdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      setResult({ status: 'invalid', message: 'Harap unggah file PDF.' });
      setShowModal(true);
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('pdfFile', file);
      const res = await fetch('http://localhost:5000/api/extract-pdf', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal ekstrak PDF.');
      setPreviewData(data);
    } catch (e) {
      setResult({ status: 'invalid', message: e.message });
      setShowModal(true);
    } finally {
      setLoading(false);
      fileInputRef.current.value = '';
    }
  };

  // 3) Verifikasi dari preview PDF
  const verifyPreview = async () => {
    if (!previewData) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/verifikasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nim: previewData.nim,
          universitas: previewData.universitas,
          nomerSertifikat: previewData.nomerSertifikat,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ status: 'invalid', message: e.message });
    } finally {
      setLoading(false);
      setShowModal(true);
      setPreviewData(null);
    }
  };

  // 4) QR-scanner
  useEffect(() => {
    if (scanning) {
      const html5Qr = new Html5Qrcode('reader-container');
      scannerRef.current = html5Qr;
      html5Qr
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decoded) => {
            html5Qr.stop();
            setScanning(false);
            const parts = decoded.split('/');
            verifyHash(parts[parts.length - 1]);
          },
        )
        .catch(() => {
          setResult({
            status: 'invalid',
            message: 'Gagal akses kamera. Cek izin.',
          });
          setShowModal(true);
          setScanning(false);
        });
    }
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [scanning]);

  return (
    <div className="b-verify">
      <nav className="b-verify__navbar">
        <div className="b-verify__brand">B-Verify</div>
      </nav>

      <main className="b-verify__main-content">
        <div className="b-verify__container">
          <h1 className="b-verify__title">Verify Certificate</h1>
          <p className="b-verify__subtitle">
            Verify Your Certificate With QrCode, PDF, Or Digital Signature
          </p>

          {!previewData && (
            <>
              <form
                className="b-verify__input-group"
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyHash(inputValue.trim());
                }}>
                <input
                  type="text"
                  className="b-verify__input"
                  placeholder="Masukkan hash..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={loading || scanning}
                />
                <button type="submit" className="b-verify__button" disabled={loading || scanning}>
                  Verify
                </button>
              </form>

              <div className="b-verify__actions">
                <button
                  className="b-verify__button b-verify__button--primary"
                  onClick={() => setScanning((v) => !v)}
                  disabled={loading}>
                  <FaCamera style={{ marginRight: 8 }} />
                  {scanning ? 'Stop Scan' : 'Scan QR Code'}
                </button>
                <button
                  className="b-verify__button b-verify__button--secondary"
                  onClick={() => fileInputRef.current.click()}
                  disabled={loading}>
                  <FaFileUpload style={{ marginRight: 8 }} />
                  Verify with PDF
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={onPdfUpload}
                />
              </div>

              {scanning && <div id="reader-container" className="b-verify__reader" />}
            </>
          )}

          {loading && <div className="b-verify__loading-text">Verifying…</div>}

          {previewData && !loading && (
            <div className="b-verify__preview-card">
              <div className="b-verify__preview-header">
                <FaFilePdf />
                <h4>Preview Data dari PDF</h4>
              </div>
              <div className="b-verify__data-table">
                {Object.entries(previewData).map(([key, val]) => (
                  <div className="b-verify__data-row" key={key}>
                    <span className="b-verify__data-label">
                      {key.charAt(0).toUpperCase() + key.slice(1)}:
                    </span>
                    <span className="b-verify__data-value">{val}</span>
                  </div>
                ))}
              </div>
              <div className="b-verify__preview-actions">
                <button
                  className="b-verify__button b-verify__button--cancel"
                  onClick={() => setPreviewData(null)}>
                  Batal
                </button>
                <button
                  className="b-verify__button b-verify__button--primary"
                  onClick={verifyPreview}>
                  Verify Now
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {showModal && result && (
        <div className="b-verify__modal-overlay" onClick={() => setShowModal(false)}>
          <div className="b-verify__modal" onClick={(e) => e.stopPropagation()}>
            <button className="b-verify__modal-close" onClick={() => setShowModal(false)}>
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

            {/* Hanya field yang diinginkan */}
            {result.data && (
              <>
                <h4>Certificate Data</h4>
                <div className="b-verify__data-table">
                  <div className="b-verify__data-row">
                    <span className="b-verify__data-label">NIM:</span>
                    <span className="b-verify__data-value">{result.data.nim}</span>
                  </div>
                  <div className="b-verify__data-row">
                    <span className="b-verify__data-label">Universitas:</span>
                    <span className="b-verify__data-value">{result.data.universitas}</span>
                  </div>
                  <div className="b-verify__data-row hash">
                    <span className="b-verify__data-label">Hash Metadata:</span>
                    <span className="b-verify__data-value">{result.data.hashMetadata}</span>
                  </div>
                  <div className="b-verify__data-row">
                    <span className="b-verify__data-label">Jurusan:</span>
                    <span className="b-verify__data-value">{result.data.jurusan}</span>
                  </div>
                  <div className="b-verify__data-row">
                    <span className="b-verify__data-label">Fakultas:</span>
                    <span className="b-verify__data-value">{result.data.fakultas}</span>
                  </div>
                  <div className="b-verify__data-row">
                    <span className="b-verify__data-label">Tahun Lulus:</span>
                    <span className="b-verify__data-value">{result.data.tahunLulus}</span>
                  </div>
                  <div className="b-verify__data-row">
                    <span className="b-verify__data-label">Nama:</span>
                    <span className="b-verify__data-value">{result.data.nama}</span>
                  </div>
                  <div className="b-verify__data-row">
                    <span className="b-verify__data-label">No. Sertifikat:</span>
                    <span className="b-verify__data-value">{result.data.nomerSertifikat}</span>
                  </div>
                  <div className="b-verify__data-row">
                    <span className="b-verify__data-label">CID Detail:</span>
                    <span className="b-verify__data-value">{result.data.cidDetail}</span>
                  </div>
                  <div className="b-verify__data-row">
                    <span className="b-verify__data-label">Dokumen:</span>
                    <span className="b-verify__data-value">
                      {/* asumsikan metadata berisi pathIjazah & pathSkpi */}
                      <a
                        href={`${IPFS_GATEWAY}${
                          result.data.cidDetail
                        }/${result.data.pathIjazah?.replace('./', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="b-verify__button b-verify__button--secondary">
                        <FaFilePdf style={{ marginRight: 6 }} />
                        Ijazah
                      </a>
                      <a
                        href={`${IPFS_GATEWAY}${
                          result.data.cidDetail
                        }/${result.data.pathSkpi?.replace('./', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="b-verify__button b-verify__button--secondary"
                        style={{ marginLeft: 10 }}>
                        <FaFilePdf style={{ marginRight: 6 }} />
                        SKPI
                      </a>
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Info blok terpisah */}
            {result.info_blok && (
              <>
                <h4>Block Info</h4>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
