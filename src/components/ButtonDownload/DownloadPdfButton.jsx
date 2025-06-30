// src/components/downloadpdf/DownloadPdfButton.jsx
import React from 'react';
import Web3 from 'web3';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import contractABI from '../../abi/BlockchainSertifikasi.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const API_GATEWAY = import.meta.env.VITE_API_BASE;
const VERIFY_BASE_URL = import.meta.env.VITE_VERIFY_BASE_URL || 'https://your-domain.com/verify';

const DownloadPdfButton = ({ nim, label = 'Cetak Sertifikat (PDF)' }) => {
  const handleDownloadPDF = async () => {
    try {
      // 1) Inisialisasi Web3 & kontrak
      if (!window.ethereum) throw new Error('MetaMask tidak terdeteksi');
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

      // 2) Ambil ID & detail on-chain
      const id = await contract.methods.idByNIM(nim).call();
      const zeroId = '0x'.padEnd(66, '0');
      if (id === zeroId) throw new Error('Sertifikat tidak ditemukan');
      const cert = await contract.methods.getSertifikatById(id).call();
      const { universitas, nomerSertifikat, hashMetadata, cidDetail } = cert;

      console.log(cidDetail);
      // 3) Fetch metadata.json dari IPFS
      const resMeta = await fetch(
        `${API_GATEWAY}/api/certificate/metadata?cid=${cidDetail}&nim=${nim}`,
      );
      if (!resMeta.ok) throw new Error('Gagal mengambil metadata dari IPFS');
      const { nama, jurusan, fakultas, tahunLulus } = await resMeta.json();

      // 4) Generate QR code untuk verifikasi
      const verificationUrl = `${VERIFY_BASE_URL}/${hashMetadata}`;
      const qrDataURL = await QRCode.toDataURL(verificationUrl);

      // 5) Setup jsPDF
      const doc = new jsPDF('p', 'mm', 'a4');
      const w = doc.internal.pageSize.getWidth();
      const margin = 25;
      let y = 30;

      // — UNIVERSITAS (HEADER) —
      doc.setFont('helvetica', 'normal').setFontSize(14);
      doc.text(universitas.toUpperCase(), w / 2, y, { align: 'center' });

      // — Garis Pemisah —
      y += 10;
      doc.setLineWidth(0.5).line(margin, y, w - margin, y);

      // — JUDUL SERTIFIKAT —
      y += 15;
      doc.setFont('helvetica', 'bold').setFontSize(16);
      doc.text('SERTIFIKAT KELULUSAN', w / 2, y, { align: 'center' });

      // — Label Blockchain Hash —
      y += 15;
      doc.setFont('helvetica', 'normal').setFontSize(10);
      doc.text('Tanda Tangan Digital (Blockchain Hash)', w / 2, y, { align: 'center' });

      // — Teks Hash (monospaced) —
      y += 6;
      doc.setFont('courier', 'normal').setFontSize(9).setTextColor(100);
      const hashText = hashMetadata.toLowerCase();
      doc.text(hashText, w / 2, y, { align: 'center' });
      doc.setTextColor(0);

      // — Nama Penerima —
      y += 20;
      doc.setFont('helvetica', 'bold').setFontSize(18);
      doc.text(nama.toUpperCase(), w / 2, y, { align: 'center' });

      // — Kalimat Pengumuman —
      y += 12;
      doc.setFont('helvetica', 'normal').setFontSize(12);
      doc.text('telah memenuhi segala syarat kelulusan dan dinyatakan', w / 2, y, {
        align: 'center',
      });

      // — Status LULUS —
      y += 10;
      doc.setFont('helvetica', 'bold').setFontSize(14);
      doc.text('LULUS', w / 2, y, { align: 'center' });

      // — Detail Kelulusan (Layout Baru) —
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
        doc.text(value, col2_x, y);
        y += 8;
      });

      // — Footer: Tanggal & TTD Fisik —
      let sigY = y + 20;
      doc.setFont('helvetica', 'normal').setFontSize(12);

      // Bagian Kanan (Rektor)
      doc.text(`Yogyakarta, ${tahunLulus}`, w - margin, sigY, { align: 'right' });
      doc.text('Rektor,', w - margin, sigY + 7, { align: 'right' });
      doc.text('(Nama Rektor)', w - margin, sigY + 30, { align: 'right' });

      // Bagian Kiri (Dekan)
      doc.text('Dekan,', margin, sigY + 7);
      doc.text('(Nama Dekan)', margin, sigY + 30);

      // — QR Code & Instruksi Verifikasi —
      const qrSize = 30;
      let qrY = doc.internal.pageSize.getHeight() - margin - qrSize;
      doc.addImage(qrDataURL, 'PNG', margin, qrY, qrSize, qrSize);

      const textQrX = margin + qrSize + 5;
      const textQrY = qrY + qrSize / 2 - 3;

      doc.setFont('helvetica', 'bold').setFontSize(8);
      doc.text('Verifikasi Keaslian Dokumen:', textQrX, textQrY);
      doc.setFont('helvetica', 'normal').setFontSize(8);
      doc.text('Pindai QR Code untuk detail sertifikat di blockchain.', textQrX, textQrY + 6);

      // — Simpan PDF —
      doc.save(`Sertifikat_${nama.replace(/\s+/g, '_')}_${nim}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Gagal membuat PDF: ' + err.message);
    }
  };

  return (
    <button className="ds-action-btn ds-download-btn" onClick={handleDownloadPDF}>
      {label}
    </button>
  );
};

export default DownloadPdfButton;
