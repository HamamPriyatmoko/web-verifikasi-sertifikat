import React, { useState } from 'react';
import { FaDownload } from 'react-icons/fa';
import { AiOutlineLoading } from 'react-icons/ai';
import Web3 from 'web3';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import contractABI from '../../abi/BlockchainSertifikasi.json';

// Pastikan variabel ini sesuai dengan file .env Anda
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const API_GATEWAY = import.meta.env.VITE_API_BASE;
const VERIFY_BASE_URL = import.meta.env.VITE_VERIFY_BASE_URL || 'https://your-domain.com/verify';

const DownloadPdfButton = ({ nim, className, label }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true); // Mulai loading
    try {
      // 1. Inisialisasi & Koneksi ke Blockchain
      if (!window.ethereum) throw new Error('MetaMask tidak terdeteksi');
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

      // 2. Ambil Data dari Smart Contract dan IPFS
      const id = await contract.methods.idByNIM(nim).call();
      if (id === '0x'.padEnd(66, '0')) throw new Error('Sertifikat untuk NIM ini tidak ditemukan');
      const cert = await contract.methods.getSertifikatById(id).call();
      const { universitas, nomerSertifikat, hashMetadata, cidDetail } = cert;

      const resMeta = await fetch(
        `${API_GATEWAY}/api/certificate/metadata?cid=${cidDetail}&nim=${nim}`,
        {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        },
      );
      if (!resMeta.ok) throw new Error('Gagal mengambil metadata dari IPFS');
      const { nama, jurusan, fakultas, tahunLulus } = await resMeta.json();

      // 3. Generate QR Code
      const verificationUrl = `${VERIFY_BASE_URL}/${hashMetadata}`;
      const qrDataURL = await QRCode.toDataURL(verificationUrl, { width: 300 });

      // 4. Buat Dokumen PDF
      const doc = new jsPDF('p', 'mm', 'a4');
      const w = doc.internal.pageSize.getWidth();
      const margin = 25;
      let y = 30;

      // --- Desain Konten PDF ---
      doc.setFont('helvetica', 'normal').setFontSize(14);
      doc.text(universitas.toUpperCase(), w / 2, y, { align: 'center' });

      y += 10;
      doc.setLineWidth(0.5).line(margin, y, w - margin, y);

      y += 15;
      doc.setFont('helvetica', 'bold').setFontSize(16);
      doc.text('SERTIFIKAT KELULUSAN', w / 2, y, { align: 'center' });

      y += 15;
      doc.setFont('helvetica', 'normal').setFontSize(10);
      doc.text('Tanda Tangan Digital (Blockchain Hash)', w / 2, y, { align: 'center' });

      y += 6;
      doc.setFont('courier', 'normal').setFontSize(9).setTextColor(100);
      doc.text(hashMetadata.toLowerCase(), w / 2, y, { align: 'center' });
      doc.setTextColor(0);

      y += 20;
      doc.setFont('helvetica', 'bold').setFontSize(18);
      doc.text(nama.toUpperCase(), w / 2, y, { align: 'center' });

      y += 12;
      doc.setFont('helvetica', 'normal').setFontSize(12);
      doc.text('telah memenuhi segala syarat kelulusan dan dinyatakan', w / 2, y, {
        align: 'center',
      });

      y += 10;
      doc.setFont('helvetica', 'bold').setFontSize(14);
      doc.text('LULUS', w / 2, y, { align: 'center' });

      y += 20;
      doc.setFont('helvetica', 'normal').setFontSize(11);
      const details = [
        ['Nomor Sertifikat', nomerSertifikat],
        ['Nomor Induk Mahasiswa', nim],
        ['Program Studi', jurusan],
        ['Fakultas', fakultas],
        ['Tahun Lulus', tahunLulus],
      ];

      const labelWidth = 55;
      const col2_x = margin + labelWidth;
      details.forEach(([labelText, value]) => {
        doc.text(labelText, margin, y);
        doc.text(':', col2_x - 3, y, { align: 'right' });
        doc.text(String(value), col2_x, y);
        y += 8;
      });

      // --- Footer dengan TTD dan QR Code ---
      let sigY = y + 20;
      doc.setFont('helvetica', 'normal').setFontSize(12);

      doc.text(
        `Yogyakarta, ${new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}`,
        w - margin,
        sigY,
        { align: 'right' },
      );
      doc.text('Rektor,', w - margin, sigY + 7, { align: 'right' });
      doc.text('(Nama Rektor)', w - margin, sigY + 30, { align: 'right' });

      const qrSize = 30;
      const qrY = doc.internal.pageSize.getHeight() - margin - qrSize - 10; // Naikkan sedikit QR
      doc.addImage(qrDataURL, 'PNG', margin, qrY, qrSize, qrSize);

      const textQrX = margin + qrSize + 5;
      const textQrY = qrY + qrSize / 2 - 3;
      doc.setFont('helvetica', 'bold').setFontSize(8);
      doc.text('Verifikasi Keaslian Dokumen:', textQrX, textQrY);
      doc.setFont('helvetica', 'normal').setFontSize(8);
      doc.text('Pindai QR Code untuk detail sertifikat di blockchain.', textQrX, textQrY + 6);

      // 5. Simpan PDF
      doc.save(`Sertifikat_${nama.replace(/\s+/g, '_')}_${nim}.pdf`);
    } catch (err) {
      console.error('Error saat membuat PDF:', err);
      alert('Gagal membuat PDF: ' + err.message);
    } finally {
      setIsDownloading(false); // Selesaikan loading, baik berhasil maupun gagal
    }
  };

  return (
    <button
      className={className || 'ds-action-btn'}
      onClick={handleDownloadPDF}
      disabled={isDownloading} // Tombol tidak bisa diklik saat sedang mengunduh
    >
      {isDownloading ? (
        <>
          <AiOutlineLoading className="ds-button-spinner" />
          <span>Mengunduh...</span>
        </>
      ) : (
        label // Tampilkan label asli (ikon + teks "Download")
      )}
    </button>
  );
};

export default DownloadPdfButton;
