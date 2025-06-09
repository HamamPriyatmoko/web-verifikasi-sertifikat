import React, { useState } from 'react';
import './Dashboard.css';
import Footer from '../../components/Footer';

const initialState = {
  nama: '',
  universitas: '',
  jurusan: '',
  sertifikatToefl: '',
  sertifikatBTA: '',
  sertifikatSKP: '',
  tanggal: '',
};

const Dashboard = () => {
  const [formData, setFormData] = useState(initialState);
  const [fileData, setFileData] = useState({ pdf_toefl: null, pdf_bta: null, pdf_skp: null });
  const [errors, setErrors] = useState({});
  const [statusMsg, setStatusMsg] = useState('');

  const universitasList = [
    'Universitas Muhammadiyah Yogyakarta',
    'Universitas Gadjah Mada',
    'Institut Teknologi Bandung',
    'Universitas Indonesia',
  ];

  const jurusanList = [
    'Teknologi Informasi',
    'Teknik Elektro',
    'Ilmu Komputer',
    'Sistem Informasi',
    'Teknik Mesin',
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nama) newErrors.nama = 'Nama wajib diisi';
    if (!formData.universitas) newErrors.universitas = 'Pilih universitas';
    if (!formData.jurusan) newErrors.jurusan = 'Pilih jurusan';
    if (!formData.sertifikatToefl) newErrors.sertifikatToefl = 'No. Sertifikat TOEFL wajib diisi';
    if (!formData.sertifikatBTA) newErrors.sertifikatBTA = 'No. Sertifikat BTA wajib diisi';
    if (!formData.sertifikatSKP) newErrors.sertifikatSKP = 'No. Sertifikat SKP wajib diisi';
    if (!formData.tanggal) newErrors.tanggal = 'Tanggal wajib diisi';
    if (!fileData.pdf_toefl) newErrors.pdf_toefl = 'File PDF TOEFL wajib diupload';
    if (!fileData.pdf_bta) newErrors.pdf_bta = 'File PDF BTA wajib diupload';
    if (!fileData.pdf_skp) newErrors.pdf_skp = 'File PDF SKP wajib diupload';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleFileChange = (e) => {
    setFileData({ ...fileData, [e.target.name]: e.target.files[0] });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    if (!validateForm()) {
      setStatusMsg('Harap perbaiki error pada form.');
      return;
    }
    setStatusMsg('Menerbitkan sertifikat ke blockchain...');
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([key, val]) => fd.append(key, val));
      fd.append('pdf_toefl', fileData.pdf_toefl);
      fd.append('pdf_bta', fileData.pdf_bta);
      fd.append('pdf_skp', fileData.pdf_skp);

      const res = await fetch('http://127.0.0.1:5000/terbitkan_sertifikat_blockchain', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.transaction_hash) {
        setStatusMsg('Sukses! Sertifikat telah diterbitkan di blockchain.');
        setFormData(initialState);
        setFileData({ pdf_toefl: null, pdf_bta: null, pdf_skp: null });
        setErrors({});
      } else {
        setStatusMsg(data.error || 'Gagal menerbitkan sertifikat. Coba lagi.');
      }
    } catch (err) {
      setStatusMsg('Terjadi kesalahan koneksi. Pastikan server backend berjalan.');
      console.error('API call failed:', err);
    }
  };

  return (
    <div className="dashboard-page-content">
      <main className="dashboard-container">
        <div className="dashboard-header">
          <h2 className="dashboard-heading">Terbitkan Sertifikat</h2>
          <p className="dashboard-subtext">
            Isi data sertifikat di bawah ini dengan lengkap dan benar. Semua field wajib diisi.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="dashboard-form">
          <div className="dashboard-card">
            {/* Text Inputs */}
            <div className="dashboard-form-group">
              <label htmlFor="nama" className="dashboard-label">
                Nama Lengkap
              </label>
              <input
                id="nama"
                name="nama"
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={formData.nama}
                onChange={handleChange}
                className={`dashboard-input ${errors.nama ? 'input-error' : ''}`}
              />
              {errors.nama && <p className="error-text">{errors.nama}</p>}
            </div>

            <div className="dashboard-form-row">
              <div className="dashboard-form-group">
                <label htmlFor="universitas" className="dashboard-label">
                  Universitas
                </label>
                <select
                  id="universitas"
                  name="universitas"
                  value={formData.universitas}
                  onChange={handleChange}
                  className={`dashboard-input ${errors.universitas ? 'input-error' : ''}`}>
                  <option value="">-- Pilih Universitas --</option>
                  {universitasList.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                {errors.universitas && <p className="error-text">{errors.universitas}</p>}
              </div>
              <div className="dashboard-form-group">
                <label htmlFor="jurusan" className="dashboard-label">
                  Jurusan
                </label>
                <select
                  id="jurusan"
                  name="jurusan"
                  value={formData.jurusan}
                  onChange={handleChange}
                  className={`dashboard-input ${errors.jurusan ? 'input-error' : ''}`}>
                  <option value="">-- Pilih Jurusan --</option>
                  {jurusanList.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
                {errors.jurusan && <p className="error-text">{errors.jurusan}</p>}
              </div>
            </div>

            <div className="dashboard-form-row">
              <div className="dashboard-form-group">
                <label htmlFor="sertifikatToefl" className="dashboard-label">
                  No. Sertifikat TOEFL
                </label>
                <input
                  id="sertifikatToefl"
                  name="sertifikatToefl"
                  type="text"
                  placeholder="Contoh: 1234567890"
                  value={formData.sertifikatToefl}
                  onChange={handleChange}
                  className={`dashboard-input ${errors.sertifikatToefl ? 'input-error' : ''}`}
                />
                {errors.sertifikatToefl && <p className="error-text">{errors.sertifikatToefl}</p>}
              </div>
              <div className="dashboard-form-group">
                <label htmlFor="sertifikatBTA" className="dashboard-label">
                  No. Sertifikat BTA
                </label>
                <input
                  id="sertifikatBTA"
                  name="sertifikatBTA"
                  type="text"
                  placeholder="Contoh: 0987654321"
                  value={formData.sertifikatBTA}
                  onChange={handleChange}
                  className={`dashboard-input ${errors.sertifikatBTA ? 'input-error' : ''}`}
                />
                {errors.sertifikatBTA && <p className="error-text">{errors.sertifikatBTA}</p>}
              </div>
            </div>

            <div className="dashboard-form-group">
              <label htmlFor="sertifikatSKP" className="dashboard-label">
                No. Sertifikat SKP
              </label>
              <input
                id="sertifikatSKP"
                name="sertifikatSKP"
                type="text"
                placeholder="Contoh: 1122334455"
                value={formData.sertifikatSKP}
                onChange={handleChange}
                className={`dashboard-input ${errors.sertifikatSKP ? 'input-error' : ''}`}
              />
              {errors.sertifikatSKP && <p className="error-text">{errors.sertifikatSKP}</p>}
            </div>

            <div className="dashboard-form-group">
              <label htmlFor="tanggal" className="dashboard-label">
                Tanggal Terbit
              </label>
              <input
                id="tanggal"
                name="tanggal"
                type="date"
                value={formData.tanggal}
                onChange={handleChange}
                className={`dashboard-input ${errors.tanggal ? 'input-error' : ''}`}
              />
              {errors.tanggal && <p className="error-text">{errors.tanggal}</p>}
            </div>

            {/* File Inputs */}
            <div className="dashboard-form-group">
              <label htmlFor="pdf_toefl" className="dashboard-label">
                Upload PDF TOEFL
              </label>
              <input
                id="pdf_toefl"
                name="pdf_toefl"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className={`dashboard-input ${errors.pdf_toefl ? 'input-error' : ''}`}
              />
              {errors.pdf_toefl && <p className="error-text">{errors.pdf_toefl}</p>}
            </div>

            <div className="dashboard-form-group">
              <label htmlFor="pdf_bta" className="dashboard-label">
                Upload PDF BTA
              </label>
              <input
                id="pdf_bta"
                name="pdf_bta"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className={`dashboard-input ${errors.pdf_bta ? 'input-error' : ''}`}
              />
              {errors.pdf_bta && <p className="error-text">{errors.pdf_bta}</p>}
            </div>

            <div className="dashboard-form-group">
              <label htmlFor="pdf_skp" className="dashboard-label">
                Upload PDF SKP
              </label>
              <input
                id="pdf_skp"
                name="pdf_skp"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className={`dashboard-input ${errors.pdf_skp ? 'input-error' : ''}`}
              />
              {errors.pdf_skp && <p className="error-text">{errors.pdf_skp}</p>}
            </div>
          </div>

          <div className="dashboard-form-action">
            <button type="submit" className="dashboard-button">
              Terbitkan Sertifikat
            </button>
          </div>
        </form>

        {statusMsg && (
          <div className="dashboard-status">
            <p
              className={`status-text ${
                statusMsg.includes('Sukses')
                  ? 'success'
                  : statusMsg.includes('Harap perbaiki')
                  ? 'error'
                  : statusMsg.includes('Gagal')
                  ? 'error'
                  : 'info'
              }
            `}>
              {statusMsg}
            </p>
          </div>
        )}

        <div className="dashboard-footer-wrapper">
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
