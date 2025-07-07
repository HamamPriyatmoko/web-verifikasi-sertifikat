import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { web3Read } from '../../utils/web3.js';
import contractABI from '../../abi/BlockchainSertifikasi.json';
import './HasilVerifikasi.css';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export default function HasilVerifikasi() {
  const { hash } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('data');

  useEffect(() => {
    // Logika useEffect tetap sama, tidak perlu diubah
    if (!hash) {
      setError('Hash tidak ditemukan di URL.');
      setLoading(false);
      return;
    }

    const verifyCertificate = async () => {
      try {
        setLoading(true);
        setError('');

        const contract = new web3Read.eth.Contract(contractABI, CONTRACT_ADDRESS);
        const cert = await contract.methods.findSertifikatHash(hash).call();

        if (cert.id === '0x'.padEnd(66, '0')) {
          throw new Error('Sertifikat tidak valid atau hash tidak terdaftar.');
        }

        const blk = await web3Read.eth.getBlock(cert.blockNumber);
        const metaRes = await fetch(
          `${IPFS_GATEWAY}${cert.cidDetail}/sertifikat-${cert.nim}/metadata.json`,
        );
        if (!metaRes.ok) throw new Error('Gagal mengambil metadata detail dari IPFS.');
        const meta = await metaRes.json();

        setResult({
          data: {
            nama: meta.nama,
            nim: cert.nim,
            universitas: cert.universitas,
            jurusan: meta.jurusan,
            nomerSertifikat: cert.nomerSertifikat,
            hashMetadata: cert.hashMetadata,
          },
          info_blok: {
            nomorBlok: Number(blk.number),
            hashBlok: blk.hash,
            parentHash: blk.parentHash,
            timestamp: new Date(Number(blk.timestamp) * 1000).toLocaleString('id-ID'),
            transactions_count: blk.transactions.length,
          },
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    verifyCertificate();
  }, [hash]);

  if (loading) {
    return (
      <div className="hasilverifikasi-container">
        <div className="hasilverifikasi-loader"></div>
        <p>Memverifikasi data...</p>
      </div>
    );
  }

  return (
    <div className="hasilverifikasi-container">
      {error && (
        <div className="hasilverifikasi-card error">
          <h1 className="hasilverifikasi-status-title">
            <FaTimesCircle /> Verifikasi Gagal
          </h1>
          <p className="hasilverifikasi-error-message">{error}</p>
          <button className="hasilverifikasi-back-btn" onClick={() => navigate('/verifikasi')}>
            Kembali ke Verifikasi
          </button>
        </div>
      )}

      {result && (
        <div className="hasilverifikasi-card success">
          <div className="hasilverifikasi-header">
            <h3>
              <FaCheckCircle /> Sertifikat Terverifikasi
            </h3>
          </div>
          <div className="hasilverifikasi-body">
            <div className="hasilverifikasi-tabs">
              <button
                className={`hasilverifikasi-tab ${activeTab === 'data' ? 'active' : ''}`}
                onClick={() => setActiveTab('data')}>
                Data Sertifikat
              </button>
              <button
                className={`hasilverifikasi-tab ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}>
                Info Blok
              </button>
            </div>

            <div className={`hasilverifikasi-tab-content ${activeTab === 'data' ? 'active' : ''}`}>
              <div className="hasilverifikasi-data-table">
                {Object.entries(result.data).map(([key, value]) => (
                  <React.Fragment key={key}>
                    <span className="hasilverifikasi-data-label">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    </span>
                    <span className="hasilverifikasi-data-value">{value}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className={`hasilverifikasi-tab-content ${activeTab === 'info' ? 'active' : ''}`}>
              <div className="hasilverifikasi-data-table">
                {Object.entries(result.info_blok).map(([key, value]) => (
                  <React.Fragment key={key}>
                    <span className="hasilverifikasi-data-label">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    </span>
                    <span className="hasilverifikasi-data-value">{value}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
          <div className="hasilverifikasi-footer">
            <button className="hasilverifikasi-back-btn" onClick={() => navigate('/')}>
              Kembali
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
