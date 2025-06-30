// src/landing/Home.jsx (Versi Refactor & Profesional)

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { FaCamera, FaFileUpload, FaSpinner } from 'react-icons/fa';
import { web3Read } from '../utils/web3';
import contractABI from '../abi/BlockchainSertifikasi.json';
import VerificationModal from '../components/VerificationModal/VerificationModal'; // <-- GUNAKAN KEMBALI MODAL
import './Home.css'; // <-- Gunakan CSS baru

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const IPFS_GATEWAY = import.meta.env.VITE_API_BASE;

export default function Home() {
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef();
  const scannerRef = useRef();

  const readContract = new web3Read.eth.Contract(contractABI, CONTRACT_ADDRESS);

  // Fungsi utama verifikasi (hanya via hash)
  const verifyHash = async (hash) => {
    setLoading(true);
    setResult(null);
    setError('');

    try {
      if (!hash) throw new Error('Hash tidak boleh kosong.');

      const cert = await readContract.methods.getSertifikatByHash(hash).call();
      if (cert.id === '0x'.padEnd(66, '0')) {
        throw new Error('Sertifikat dengan hash ini tidak terdaftar di blockchain.');
      }

      const blk = await web3Read.eth.getBlock(cert.blockNumber);
      const metaRes = await fetch(`${IPFS_GATEWAY}/api/certificate/metadata?cid=${cert.cidDetail}`);
      if (!metaRes.ok) throw new Error('Gagal mengambil detail sertifikat dari IPFS.');
      const meta = await metaRes.json();

      setResult({
        data: { ...meta, ...cert },
        info_blok: {
          nomorBlok: Number(blk.number),
          hashBlok: blk.hash,
          parentHash: blk.parentHash,
          timestamp: Number(blk.timestamp),
          transactions_count: blk.transactions.length,
        },
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Alur baru untuk PDF: upload -> ekstrak -> langsung verifikasi
  const onPdfUpload = async (e) => {
    const file = e.target.files[0];
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!file || file.type !== 'application/pdf') {
      setError('Harap unggah file dengan format PDF.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const fd = new FormData();
      fd.append('file_sertifikat', file);

      const res = await fetch(`${API_URL}/api/verify-pdf`, { method: 'POST', body: fd });
      const body = await res.json();

      if (!res.ok) throw new Error(body.error || 'Gagal mengekstrak data dari PDF.');

      // Langsung verifikasi hash yang didapat dari API
      await verifyHash(body.hashMetadata);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!scanning) return;
    const scanner = new Html5Qrcode('reader-container');
    scannerRef.current = scanner;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!devices || !devices.length) throw new Error('Kamera tidak ditemukan.');
        scanner
          .start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              scanner.stop();
              setScanning(false);
              const parts = decodedText.split('/');
              verifyHash(parts[parts.length - 1]);
            },
            (errorMessage) => {
              console.log(errorMessage);
            },
          )
          .catch((err) => {
            console.log(err);
            setError('Gagal memulai scanner. Mohon berikan izin kamera.');
          });
      })
      .catch((err) => setError(err.message));

    return () => scannerRef.current?.isScanning && scannerRef.current.stop();
  }, [scanning]);

  const closeModal = () => {
    setResult(null);
    setError('');
  };

  return (
    <div className="home-page">
      <nav className="home-navbar">
        <Link to="/" className="home-brand">
          B-Verify
        </Link>
        <Link to="/login" className="home-nav-link">
          Login Admin
        </Link>
      </nav>

      <main>
        <section className="home-hero">
          <h1 className="home-title">
            Verifikasi Keaslian Sertifikat <span>Anda</span>.
          </h1>
          <p className="home-subtitle">
            Validasi keaslian sertifikat melalui teknologi blockchain.
          </p>
        </section>

        <section className="verification-card">
          {!scanning && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                verifyHash(inputValue.trim());
              }}>
              <div className="input-group">
                <input
                  type="text"
                  className="verification-input"
                  placeholder="Masukkan Tanda Tangan Digital (Hash)..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  className="action-btn primary"
                  disabled={loading || !inputValue}>
                  {loading ? <FaSpinner className="spinner" /> : 'Verifikasi'}
                </button>
              </div>
            </form>
          )}

          <div className="action-buttons">
            <button
              className="action-btn secondary"
              onClick={() => setScanning((v) => !v)}
              disabled={loading}>
              <FaCamera /> {scanning ? 'Hentikan Scan' : 'Pindai QR Code'}
            </button>
            <button
              className="action-btn secondary"
              onClick={() => fileInputRef.current.click()}
              disabled={loading}>
              <FaFileUpload /> Unggah PDF
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={onPdfUpload}
            />
          </div>

          <div className="scanner-container">
            {scanning && <div id="reader-container" />}
            {loading && (
              <div className="loading-container">
                <FaSpinner className="spinner" /> Memproses...
              </div>
            )}
            {error && <div className="verifikasi-error">{error}</div>}
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <p>&copy; {new Date().getFullYear()} B-Verify. Semua Hak Cipta Dilindungi.</p>
      </footer>

      <VerificationModal result={result} onClose={closeModal} />
    </div>
  );
}
