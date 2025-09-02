import React, { useState } from 'react';
import { FaDownload } from 'react-icons/fa';
import { AiOutlineLoading } from 'react-icons/ai';

// Impor instance web3 yang sudah jadi dari file utilitas Anda
import { web3Read } from '../../utils/web3';
import contractABI from '../../abi/BlockchainSertifikasi.json';

// Ambil variabel dari file .env
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY;

const DownloadPdfButton = ({ nim, className, label }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    if (!IPFS_GATEWAY) {
      alert('URL IPFS Gateway belum diatur di file .env');
      setIsDownloading(false);
      return;
    }

    try {
      const contract = new web3Read.eth.Contract(contractABI, CONTRACT_ADDRESS);

      const id = await contract.methods.idByNIM(nim).call();
      if (id === '0x'.padEnd(66, '0')) {
        throw new Error('Sertifikat untuk NIM ini tidak ditemukan di blockchain');
      }
      const cert = await contract.methods.getSertifikatById(id).call();
      const { cidDetail } = cert;
      const sertifikatPath = `sertifikat-${nim}`;
      const metadataUrl = `${IPFS_GATEWAY}/${cidDetail}/${sertifikatPath}/metadata.json`;
      console.log(metadataUrl);
      const metaRes = await fetch(metadataUrl);
      if (!metaRes.ok) throw new Error('Gagal mengambil metadata dari IPFS');
      const metadata = await metaRes.json();

      const certificateFilename = metadata.path_sertifikat_ringkasan;
      if (!certificateFilename) {
        throw new Error('Nama file sertifikat tidak ditemukan di dalam metadata.json');
      }
      const downloadUrl = `${IPFS_GATEWAY}/${cidDetail}/${sertifikatPath}/${certificateFilename}`;
      console.log(downloadUrl);
      window.open(downloadUrl, '_blank');
    } catch (err) {
      console.error('Error saat proses unduh dari IPFS:', err);
      alert('Gagal mengunduh PDF: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      className={className || 'ds-action-btn'}
      onClick={handleDownloadPDF}
      disabled={isDownloading}>
      {isDownloading ? (
        <>
          <AiOutlineLoading className="ds-button-spinner" />
          <span>Memproses...</span>
        </>
      ) : (
        label
      )}
    </button>
  );
};

export default DownloadPdfButton;
