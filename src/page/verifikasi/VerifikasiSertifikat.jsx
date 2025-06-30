// src/page/verifikasi/VerifikasiSertifikat.jsx (Versi Lengkap & Refactor)

import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FaCamera, FaTimes, FaFileUpload } from 'react-icons/fa';
import VerifyButton from '../../components/ButtonVerify/ButtonVerify';
import VerificationModal from '../../components/VerificationModal/VerificationModal'; // <-- IMPORT KOMPONEN BARU
import contractABI from '../../abi/BlockchainSertifikasi.json';
import './VerifikasiSertifikat.css'; // <-- Pastikan ini mengarah ke file CSS BARU
import { web3Read } from '../../utils/web3';

// --- Konfigurasi dari Environment Variables ---
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
// Gunakan VITE_API_URL dari .env, dengan fallback ke localhost:5000
const API_URL = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export default function VerifikasiSertifikat() {
  // --- State Management ---
  const [hashValue, setHashValue] = useState('');
  const [verifikasiResult, setVerifikasiResult] = useState(null); // Menggantikan showModal
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [scanning, setScanning] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);

  // --- Refs ---
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Logic Hooks & Functions ---

  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5Qrcode('reader-container');
    scannerRef.current = scanner;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          scanner
            .start(
              { deviceId: { exact: devices[0].id } },
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText) => {
                scanner.stop();
                setScanning(false);
                // Logika parsing hash dari QR code bisa ditambahkan di sini jika perlu
                handleVerifyByHash(decodedText.trim());
              },
              (errorMessage) => {
                /* Abaikan error 'QR code not found' */
                console.log(errorMessage);
              },
            )
            .catch((err) => {
              setErrorMsg('Gagal memulai scanner: ' + (err.message || err));
              setScanning(false);
            });
        } else {
          throw new Error('Tidak ada kamera yang ditemukan.');
        }
      })
      .catch((err) => {
        setErrorMsg('Error akses kamera: ' + (err.message || err));
        setScanning(false);
      });

    // Cleanup function
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [scanning]);

  const handleVerifyByHash = async (hash) => {
    setLoading(true);
    setErrorMsg('');
    setVerifikasiResult(null);
    setHashValue(hash);

    if (!hash) {
      setErrorMsg('Masukkan atau scan hash sertifikat');
      setLoading(false);
      return;
    }

    try {
      const contract = new web3Read.eth.Contract(contractABI, CONTRACT_ADDRESS);
      const cert = await contract.methods.getSertifikatByHash(hash).call();

      if (cert.id === '0x'.padEnd(66, '0')) {
        throw new Error('Hash tidak terdaftar di blockchain.');
      }

      const blk = await web3Read.eth.getBlock(cert.blockNumber);
      const metaRes = await fetch(
        `${IPFS_GATEWAY}${cert.cidDetail}/sertifikat-${cert.nim}/metadata.json`,
      );
      if (!metaRes.ok) throw new Error('Gagal mengambil metadata dari IPFS.');
      const meta = await metaRes.json();
      console.log(meta);
      const result = {
        data: {
          nim: cert.nim,
          universitas: cert.universitas,
          nama: meta.nama,
          jurusan: meta.jurusan,
          hashMetadata: cert.hashMetadata,
          nomerSertifikat: cert.nomerSertifikat,
          cidDetail: cert.cidDetail,
          pathIjazah: meta.path_ijazah,
          pathSkpi: meta.path_skpi,
        },
        info_blok: {
          nomorBlok: Number(blk.number),
          hashBlok: blk.hash,
          parentHash: blk.parentHash,
          timestamp: Number(blk.timestamp),
          transactions_count: blk.transactions.length,
        },
      };

      // **PERUBAHAN UTAMA**: Langsung set hasil verifikasi untuk memicu modal
      setVerifikasiResult(result);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }

    if (!file || file.type !== 'application/pdf') {
      setErrorMsg('Harap unggah file dengan format PDF yang valid.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const fd = new FormData();
      fd.append('file_sertifikat', file);

      const res = await fetch(`${API_URL}/api/verify-pdf`, {
        method: 'POST',
        body: fd,
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Ekstraksi data dari PDF gagal.');

      setPdfPreview(body);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPdf = () => {
    if (!pdfPreview?.hashMetadata) {
      setErrorMsg('Hash dari PDF belum tersedia untuk diverifikasi.');
      return;
    }
    handleVerifyByHash(pdfPreview.hashMetadata);
    setPdfPreview(null);
  };

  const closeModal = () => {
    setVerifikasiResult(null);
    setErrorMsg('');
  };

  return (
    <div className="verifikasi-container">
      <div className="verifikasi-content">
        <h1 className="verifikasi-title">Verifikasi Sertifikat</h1>

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
            onClick={() => handleVerifyByHash(hashValue.trim())}
            disabled={loading || !hashValue.trim() || scanning}
            loading={loading}
          />
        </div>

        <div className="verifikasi-button-group">
          <button
            className="verifikasi-action-btn camera"
            onClick={() => setScanning((v) => !v)}
            disabled={loading}>
            {scanning ? <FaTimes /> : <FaCamera />} {scanning ? 'Stop Scan' : 'Scan QR'}
          </button>
          <button
            className="verifikasi-action-btn pdf"
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

        <div className="verifikasi-dynamic-area">
          {scanning && (
            <div className="verifikasi-scanner-wrapper">
              <div id="reader-container"></div>
            </div>
          )}
          {pdfPreview && (
            <div className="verifikasi-preview">
              <h4>Pratinjau Data dari PDF</h4>
              <div className="verifikasi-data-table">
                {Object.entries(pdfPreview.extracted).map(([k, v]) => (
                  <React.Fragment key={k}>
                    <span className="verifikasi-data-label">{k}:</span>
                    <span className="verifikasi-data-value">{v || '-'}</span>
                  </React.Fragment>
                ))}
                <span className="verifikasi-data-label">Hash:</span>
                <span className="verifikasi-data-value">{pdfPreview.hashMetadata}</span>
              </div>
              <div className="verifikasi-preview-actions">
                <button className="verifikasi-cancel-btn" onClick={() => setPdfPreview(null)}>
                  Batal
                </button>
                <VerifyButton
                  text="Verifikasi Sekarang"
                  onClick={handleVerifyPdf}
                  loading={loading}
                  disabled={loading}
                />
              </div>
            </div>
          )}
          {errorMsg && <div className="verifikasi-error">{errorMsg}</div>}
          {!errorMsg && !verifikasiResult && !scanning && !pdfPreview && (
            <div className="verifikasi-empty">
              Silakan scan QR code, unggah PDF, atau masukkan hash untuk memulai verifikasi.
            </div>
          )}
        </div>
      </div>

      {/* Panggil komponen modal di sini. Modal akan muncul jika verifikasiResult tidak null */}
      <VerificationModal result={verifikasiResult} onClose={closeModal} />
    </div>
  );
}
