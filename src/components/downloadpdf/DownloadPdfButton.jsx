// src/components/downloadpdf/DownloadPdfButton.jsx
import React from 'react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const DownloadPdfButton = ({ nim, label = 'Cetak Sertifikat (PDF)' }) => {
  const handleDownloadPDF = async () => {
    try {
      // 1. Fetch data sertifikat detail
      const res = await fetch(`http://localhost:5000/api/sertifikat/nim/${nim}`);
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || payload.message || 'Gagal mengambil data sertifikat');
      }

      // 2. Destructure on-chain + off-chain
      const { sertifikat: onChain, dataOffChain: offChain = {} } = payload;
      // onChain: { nim, universitas, hashMetadata, cidDetail, nomerSertifikat, ... }
      // offChain: { nama, jurusan, fakultas, tahunLulus, pathIjazah, pathSkpi }
      const { nomerSertifikat, universitas, hashMetadata } = onChain;
      const { nama, jurusan, tahunLulus } = offChain;

      // 3. Generate QR code untuk verifikasi
      const verificationUrl = `https://your-domain.com/verify/${hashMetadata}`;
      const qrDataURL = await QRCode.toDataURL(verificationUrl);

      // 4. Setup jsPDF
      const doc = new jsPDF('p', 'mm', 'a4');
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();
      const cx = w / 2;

      // — Header —
      doc.setFontSize(16).setFont(undefined, 'bold');
      doc.text(universitas.toUpperCase(), cx, 25, { align: 'center' });
      doc.setFontSize(22).text('SERTIFIKAT KELULUSAN', cx, 48, { align: 'center' });
      doc.setLineWidth(0.5).line(30, 35, w - 30, 35);

      // — Hash (digital signature) —
      let y = 70;
      doc
        .setFontSize(12)
        .setFont(undefined, 'bold')
        .text('Tanda Tangan Digital (Blockchain Hash)', cx, y, { align: 'center' });
      y += 6;
      doc.setFont('Courier', 'normal').setFontSize(9).setTextColor(100);
      const lines = doc.splitTextToSize(hashMetadata, w - 60);
      doc.text(lines, cx, y, { align: 'center' });
      y += lines.length * 4 + 10;

      // — Nama & status —
      doc
        .setTextColor(40, 63, 125)
        .setFont(undefined, 'bold')
        .setFontSize(24)
        .text(nama.toUpperCase(), cx, y, { align: 'center' });
      y += 12;
      doc
        .setFont(undefined, 'normal')
        .setFontSize(12)
        .setTextColor(0)
        .text('telah memenuhi segala syarat kelulusan dan dinyatakan', cx, y, { align: 'center' });
      y += 10;
      doc.setFont(undefined, 'bold').setFontSize(16).text('LULUS', cx, y, { align: 'center' });
      y += 15;

      // — Detail kelulusan (ditambah nomerSertifikat) —
      const details = {
        'Nomor Sertifikat': nomerSertifikat,
        'Nomor Induk Mahasiswa': nim,
        'Program Studi': jurusan,
        'Tanggal Lulus': tahunLulus,
      };
      const keyX = 80;
      const valX = 92;
      doc.setFontSize(12);
      Object.entries(details).forEach(([k, v]) => {
        doc.setFont(undefined, 'normal').text(`${k} :`, keyX, y, { align: 'right' });
        doc.setFont(undefined, 'bold').text(String(v), valX, y);
        y += 8;
      });

      // — Tanggal & tanda tangan fisik placeholder —
      const sigY = h - 90;
      doc
        .setFont(undefined, 'normal')
        .setFontSize(12)
        .text(`Yogyakarta, ${tahunLulus}`, w - 45, sigY, { align: 'center' });
      doc.text('Dekan,', 55, sigY + 7, { align: 'center' });
      doc.text('(Nama Dekan)', 55, sigY + 30, { align: 'center' });
      doc.text('Rektor,', w - 45, sigY + 7, { align: 'center' });
      doc.text('(Nama Rektor)', w - 45, sigY + 30, { align: 'center' });

      // — QR Code Footer —
      const qrY = h - 50;
      doc.setLineWidth(0.2).line(15, qrY - 5, w - 15, qrY - 5);
      doc.addImage(qrDataURL, 'PNG', 20, qrY, 35, 35);
      doc
        .setFontSize(8)
        .setFont(undefined, 'bold')
        .text('Verifikasi Keaslian Dokumen:', 65, qrY + 15);
      doc
        .setFont(undefined, 'normal')
        .text('Pindai QR Code untuk detail sertifikat di blockchain.', 65, qrY + 19);

      // — Save PDF —
      doc.save(`Sertifikat_${nama.replace(/\s/g, '_')}_${nim}.pdf`);
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
