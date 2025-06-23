import React from 'react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const DownloadPdfButton = ({ id, label = 'Cetak Sertifikat (PDF)' }) => {
  const handleDownloadPDF = async () => {
    try {
      // 1. Fetch data sertifikat dari API backend
      const res = await fetch(`http://localhost:5000/sertifikat/${id}`);
      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Gagal mengambil data dari blockchain');
      }

      const { sertifikat } = responseData;

      // 2. Siapkan data yang akan ditampilkan
      const { nama, nim, universitas, jurusan, tanggalTerbit, hashMetadata } = sertifikat;

      // 3. Generate QR Code dari seluruh metadata
      const verificationUrl = `https://localhost:5173/verify/${hashMetadata}`;
      const qrValue = verificationUrl;
      const qrDataURL = await QRCode.toDataURL(qrValue);

      // 4. Inisialisasi Dokumen PDF
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageCenter = pageWidth / 2;

      // --- MULAI MENDESAIN SERTIFIKAT ---

      // A. Header Sertifikat (Tetap Sama)
      doc.setFont(undefined, 'bold');
      doc.setFontSize(16);
      doc.text(universitas.toUpperCase(), pageCenter, 25, { align: 'center' });
      doc.setFontSize(14);
      doc.text('FAKULTAS TEKNIK', pageCenter, 32, { align: 'center' });
      doc.setLineWidth(0.5);
      doc.line(30, 35, pageWidth - 30, 35);
      doc.setFontSize(22);
      doc.text('SERTIFIKAT KELULUSAN', pageCenter, 48, { align: 'center' });
      // doc.setFontSize(12);
      // doc.setFont(undefined, 'normal');
      // doc.text(`Nomor: ${nim}`, pageCenter, 55, { align: 'center' });

      // B. Tanda Tangan Digital (Hash) (Tetap Sama)
      let currentY = 70;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Tanda Tangan Digital (Blockchain Hash)', pageCenter, currentY, { align: 'center' });
      currentY += 5;
      doc.setFont('Courier', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100);
      const hashLines = doc.splitTextToSize(hashMetadata, pageWidth - 60);
      doc.text(hashLines, pageCenter, currentY, { align: 'center' });
      currentY += hashLines.length * 4 + 10; // Beri spasi lebih setelah hash

      // ======================================================================
      // C. Isi Sertifikat (Badan Teks) - BAGIAN YANG DIUBAH SESUAI GAMBAR
      // ======================================================================

      // Nama Mahasiswa
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(40, 63, 125); // Warna biru tua
      doc.text(nama.toUpperCase(), pageCenter, currentY, { align: 'center' });
      currentY += 10;

      // Teks Kelulusan
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0); // Kembali ke warna hitam
      doc.text('telah memenuhi segala syarat kelulusan dan dinyatakan', pageCenter, currentY, {
        align: 'center',
      });
      currentY += 10;

      // Status LULUS
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('LULUS', pageCenter, currentY, { align: 'center' });
      currentY += 15; // Beri spasi lebih besar

      // Detail Kelulusan (Format Key-Value)
      const details = {
        'Nomor Induk Mahasiswa': nim,
        'Program Studi': jurusan,
        'Tanggal Lulus': tanggalTerbit,
      };

      const keyAlignX = 88; // Semua 'key' akan berakhir di posisi x=88
      const valueStartX = 92;

      doc.setFontSize(12);
      Object.entries(details).forEach(([key, value]) => {
        // Render Key dengan rata kanan (right align)
        doc.setFont(undefined, 'normal');
        doc.text(key + ' :', keyAlignX, currentY, { align: 'right' });

        // Render Value (bold)
        doc.setFont(undefined, 'bold');
        doc.text(String(value), valueStartX, currentY);

        currentY += 8; // Pindah ke baris berikutnya
      });

      // ======================================================================
      // AKHIR DARI BAGIAN YANG DIUBAH
      // ======================================================================

      // D. Area Tanda Tangan Fisik (Placeholder) (Posisinya disesuaikan)
      const signatureY = pageHeight - 90;
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Yogyakarta, ${tanggalTerbit}`, 165, signatureY, { align: 'center' });
      doc.text('Dekan,', 55, signatureY + 7, { align: 'center' });
      doc.text('Rektor,', 165, signatureY + 7, { align: 'center' });
      doc.text('(Nama Dekan di Sini)', 55, signatureY + 30, { align: 'center' });
      doc.text('(Nama Rektor di Sini)', 165, signatureY + 30, { align: 'center' });

      // E. Bagian Verifikasi QR Code (Footer) (Tetap Sama)
      const verificationY = pageHeight - 45;
      doc.setLineWidth(0.2);
      doc.line(15, verificationY - 5, pageWidth - 15, verificationY - 5);
      doc.addImage(qrDataURL, 'PNG', 20, verificationY, 35, 35);
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      doc.text('Verifikasi Keaslian Dokumen:', 65, verificationY + 15);
      doc.setFont(undefined, 'normal');
      doc.text(
        'Pindai QR Code untuk melihat detail data sertifikat yang tercatat di blockchain.',
        65,
        verificationY + 19,
      );

      // --- SELESAI MENDESAIN, SIMPAN PDF ---
      doc.save(`Sertifikat-${nama.replace(/\s/g, '_')}-${nim}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Terjadi error saat membuat PDF: ' + e.message);
    }
  };

  return (
    <button className="ds-action-btn ds-download-btn" onClick={handleDownloadPDF}>
      {label}
    </button>
  );
};

export default DownloadPdfButton;
