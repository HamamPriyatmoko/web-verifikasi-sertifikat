// DownloadPdfButton.jsx
import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

const DownloadPdfButton = ({ id, label = 'Download PDF' }) => {
  const handleDownloadPDF = async () => {
    try {
      // Fetch data sertifikat dari blockchain
      const res = await fetch(`http://localhost:5000/get_data_sertifikat/${id}`);
      const data = await res.json();
      const { sertifikat } = data;
      console.log(sertifikat);
      if (data.error) {
        alert('Gagal mengambil data dari blockchain: ' + data.error);
        return;
      }

      // Siapkan data tampil
      const fieldLabels = {
        nama: 'Nama Lengkap',
        universitas: 'Universitas',
        jurusan: 'Jurusan',
        sertifikatToefl: 'Nilai TOEFL',
        sertifikatBTA: 'Nilai BTA',
        sertifikatSKP: 'SKP',
        tanggal: 'Tanggal Terbit',
        urlCid: 'Url Cid',
      };

      // Generate QR dari data
      const qrValue = JSON.stringify(sertifikat);
      QRCode.toDataURL(qrValue, async (err, url) => {
        if (err) {
          alert('Gagal generate QR: ' + err);
          return;
        }
        const doc = new jsPDF('p', 'mm', 'A4');

        // Sertifikat Header
        doc.setFontSize(22);
        doc.setTextColor(40, 63, 125);
        doc.text('SERTIFIKAT BLOCKCHAIN', 105, 25, { align: 'center' });

        // Garis bawah header
        doc.setDrawColor(40, 63, 125);
        doc.setLineWidth(1);
        doc.line(30, 30, 180, 30);

        // Nama peserta di tengah
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('Diberikan kepada:', 105, 45, { align: 'center' });
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text(sertifikat.nama || '-', 105, 55, { align: 'center' });
        doc.setFont(undefined, 'normal');

        // Isi detail dalam tabel 2 kolom
        const rows = [];
        Object.entries(fieldLabels).forEach(([key, label]) => {
          if (sertifikat[key]) rows.push([label, sertifikat[key]]);
        });

        autoTable(doc, {
          startY: 70,
          head: [['Field', 'Value']],
          body: rows,
          headStyles: { fillColor: [40, 63, 125], textColor: 255, fontSize: 12 },
          bodyStyles: { fontSize: 12 },
          columnStyles: {
            0: { cellWidth: 50, fontStyle: 'bold' },
            1: { cellWidth: 110 },
          },
          theme: 'grid',
        });

        // QR code di pojok kanan bawah
        const pageHeight = doc.internal.pageSize.height;
        const qrY = pageHeight - 60;
        doc.text('QR Code:', 145, qrY - 3);
        doc.addImage(url, 'PNG', 145, qrY, 50, 50);

        // Footer kecil
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Verifikasi keaslian sertifikat melalui blockchain', 105, pageHeight - 10, {
          align: 'center',
        });

        doc.save(`sertifikat-${sertifikat.nama || sertifikat.id}.pdf`);
      });
    } catch (e) {
      alert('Terjadi error: ' + e.message);
    }
  };

  return (
    <button className="ds-action-btn ds-download-btn" onClick={handleDownloadPDF}>
      {label}
    </button>
  );
};

export default DownloadPdfButton;
