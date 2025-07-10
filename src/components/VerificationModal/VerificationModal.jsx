import React, { useState } from 'react';
import { FaFilePdf, FaCheckCircle } from 'react-icons/fa';

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export default function VerificationModal({ result, onClose }) {
  const [activeTab, setActiveTab] = useState('sertifikat');

  if (!result) return null;
  console.log(result);
  const { data, info_blok } = result;
  console.log(info_blok);

  const Tab = ({ name, label }) => (
    <button
      className={`verifikasi-modal-tab ${activeTab === name ? 'active' : ''}`}
      onClick={() => setActiveTab(name)}>
      {label}
    </button>
  );

  return (
    <div className="verifikasi-modal-overlay" onClick={onClose}>
      <div className="verifikasi-modal" onClick={(e) => e.stopPropagation()}>
        <div className="verifikasi-modal-header">
          <h3>
            <FaCheckCircle /> Sertifikat Valid
          </h3>
        </div>
        <div className="verifikasi-modal-body">
          <div className="verifikasi-modal-tabs">
            <Tab name="sertifikat" label="Data Sertifikat" />
            <Tab name="blockchain" label="Detail Blockchain" />
          </div>

          <div
            className={`verifikasi-modal-tab-content ${
              activeTab === 'sertifikat' ? 'active' : ''
            }`}>
            <div className="verifikasi-data-table">
              <span className="verifikasi-data-label">Nama Lengkap:</span>
              <span className="verifikasi-data-value">{data.nama}</span>
              <span className="verifikasi-data-label">NIM:</span>
              <span className="verifikasi-data-value">{data.nim}</span>
              <span className="verifikasi-data-label">Universitas:</span>
              <span className="verifikasi-data-value">{data.universitas}</span>
              <span className="verifikasi-data-label">Jurusan:</span>
              <span className="verifikasi-data-value">{data.jurusan}</span>
              <span className="verifikasi-data-label">Nomor Sertifikat:</span>
              <span className="verifikasi-data-value">{data.nomerSertifikat}</span>
              <span className="verifikasi-data-label">Hash Metadata:</span>
              <span className="verifikasi-data-value">{data.hashMetadata}</span>
            </div>
            <div className="verifikasi-download-group">
              <a
                href={`${IPFS_GATEWAY}${data.cidDetail}/sertifikat-${data.nim}/${data.pathIjazah}`}
                target="_blank"
                rel="noopener noreferrer"
                className="verifikasi-action-btn pdf">
                <FaFilePdf /> Ijazah
              </a>
              <a
                href={`${IPFS_GATEWAY}${data.cidDetail}/sertifikat-${data.nim}/${data.pathSkpi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="verifikasi-action-btn pdf">
                <FaFilePdf /> SKPI
              </a>
            </div>
          </div>
          <div
            className={`verifikasi-modal-tab-content ${
              activeTab === 'blockchain' ? 'active' : ''
            }`}>
            <div className="verifikasi-data-table">
              <span className="verifikasi-data-label">Nomor Blok:</span>
              <span className="verifikasi-data-value">{info_blok.nomorBlok}</span>
              <span className="verifikasi-data-label">Timestamp:</span>
              <span className="verifikasi-data-value">{info_blok.timestamp}</span>
              <span className="verifikasi-data-label">Hash Blok:</span>
              <span className="verifikasi-data-value">{info_blok.hashBlok}</span>
              <span className="verifikasi-data-label">Parent Hash:</span>
              <span className="verifikasi-data-value">{info_blok.parentHash}</span>
              <span className="verifikasi-data-label">Total Transaksi:</span>
              <span className="verifikasi-data-value">{info_blok.transactions_count}</span>
            </div>
          </div>
        </div>

        <div className="verifikasi-modal-footer">
          <button className="verifikasi-modal-close-btn" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
