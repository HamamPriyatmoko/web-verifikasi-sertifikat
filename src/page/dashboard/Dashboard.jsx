// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import './Dashboard.css';
import Footer from '../../components/Footer';

// Initial form fields matching API requirements
const initialState = {
  nim: '',
  nama: '',
  universitas: '',
  jurusan: '',
  nomerSertifikat: '',
  fakultas: '',
  tahunLulus: '',
};

// Only Ijazah & SKPI files
const initialFiles = {
  file_ijazah: null,
  file_skpi: null,
};

const Dashboard = () => {
  const [formData, setFormData] = useState(initialState);
  const [fileData, setFileData] = useState(initialFiles);
  const [errors, setErrors] = useState({});
  const [statusMsg, setStatusMsg] = useState('');
  const [confirmed, setConfirmed] = useState(false);

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

  // Validate all fields & files
  const validateForm = () => {
    const newErrors = {};
    Object.entries(formData).forEach(([key, val]) => {
      if (!val) newErrors[key] = 'Wajib diisi';
    });
    Object.entries(fileData).forEach(([key, file]) => {
      if (!file) newErrors[key] = 'File PDF wajib diupload';
    });
    if (!confirmed) newErrors.confirmed = 'Anda harus menyetujui data sudah benar';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFileData({ ...fileData, [name]: files[0] });
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Data belum lengkap. Mohon isi semua field.');
      setStatusMsg('Maaf, data belum lengkap. Silakan isi semua field.');
      return;
    }

    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      Object.entries(fileData).forEach(([k, f]) => fd.append(k, f));

      const uploadPromise = fetch('http://127.0.0.1:5000/api/sertifikat', {
        method: 'POST',
        body: fd,
      }).then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Request gagal');
        return body;
      });

      toast.promise(uploadPromise, {
        loading: 'Mengunggah data & file…',
        success: '✅ Sertifikat berhasil diterbitkan!',
        error: (err) => `❌ Gagal: ${err.message}`,
      });

      await uploadPromise;

      // reset form
      setFormData(initialState);
      setFileData(initialFiles);
      setConfirmed(false);
      setErrors({});
      setStatusMsg('✅ Sertifikat berhasil diterbitkan!');
    } catch (err) {
      setStatusMsg(`❌ Gagal: ${err.message}`);
    }
  };

  return (
    <div className="dashboard-page-content">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            minWidth: '350px',
            padding: '16px 24px',
            color: '#788286',
            background: 'rgba(85, 169, 224, 0.34)',
            borderRadius: '8px',
            boxShadow: '0 4px 14px rgba(0, 95, 153, 0.2)',
          },
          success: {
            iconTheme: { primary: '#FFFFFF', secondary: '#d1e8fd' },
          },
          error: {
            iconTheme: { primary: '#FFFFFF', secondary: '#D9534F' },
          },
        }}
      />

      <main className="dashboard-container">
        <div className="dashboard-header">
          <h2 className="dashboard-heading">Terbitkan Sertifikat</h2>
        </div>

        <form onSubmit={handleSubmit} className="dashboard-form">
          {/* NIM */}
          <div className="dashboard-form-group">
            <label htmlFor="nim">NIM</label>
            <input
              id="nim"
              name="nim"
              value={formData.nim}
              onChange={handleChange}
              className={`dashboard-input ${errors.nim ? 'input-error' : ''}`}
              disabled={false}
            />
            {errors.nim && <p className="error-text">{errors.nim}</p>}
          </div>

          {/* Nama Lengkap */}
          <div className="dashboard-form-group">
            <label htmlFor="nama">Nama Lengkap</label>
            <input
              id="nama"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              className={`dashboard-input ${errors.nama ? 'input-error' : ''}`}
            />
            {errors.nama && <p className="error-text">{errors.nama}</p>}
          </div>

          {/* Universitas & Jurusan */}
          <div className="dashboard-form-row">
            <div className="dashboard-form-group">
              <label htmlFor="universitas">Universitas</label>
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
              <label htmlFor="jurusan">Jurusan</label>
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

          {/* No. Sertifikat */}
          <div className="dashboard-form-group">
            <label htmlFor="nomerSertifikat">No. Sertifikat</label>
            <input
              id="nomerSertifikat"
              name="nomerSertifikat"
              value={formData.nomerSertifikat}
              onChange={handleChange}
              className={`dashboard-input ${errors.nomerSertifikat ? 'input-error' : ''}`}
            />
            {errors.nomerSertifikat && <p className="error-text">{errors.nomerSertifikat}</p>}
          </div>

          {/* Fakultas & Tahun Lulus */}
          <div className="dashboard-form-row">
            <div className="dashboard-form-group">
              <label htmlFor="fakultas">Fakultas</label>
              <input
                id="fakultas"
                name="fakultas"
                value={formData.fakultas}
                onChange={handleChange}
                className={`dashboard-input ${errors.fakultas ? 'input-error' : ''}`}
              />
              {errors.fakultas && <p className="error-text">{errors.fakultas}</p>}
            </div>
            <div className="dashboard-form-group">
              <label htmlFor="tahunLulus">Tahun Lulus</label>
              <input
                id="tahunLulus"
                name="tahunLulus"
                type="number"
                value={formData.tahunLulus}
                onChange={handleChange}
                className={`dashboard-input ${errors.tahunLulus ? 'input-error' : ''}`}
              />
              {errors.tahunLulus && <p className="error-text">{errors.tahunLulus}</p>}
            </div>
          </div>

          {/* File Ijazah & SKPI */}
          {['file_ijazah', 'file_skpi'].map((key) => (
            <div className="dashboard-form-group" key={key}>
              <label htmlFor={key}>
                {key === 'file_ijazah' ? 'File Ijazah (PDF)' : 'File SKPI (PDF)'}
              </label>
              <input
                id={key}
                name={key}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className={`dashboard-input ${errors[key] ? 'input-error' : ''}`}
              />
              {errors[key] && <p className="error-text">{errors[key]}</p>}
            </div>
          ))}

          {/* Confirmation Checkbox */}
          <div className="dashboard-form-group">
            <label className="confirm-label">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => {
                  setConfirmed(e.target.checked);
                  setErrors((prev) => ({ ...prev, confirmed: null }));
                }}
              />{' '}
              Saya telah memeriksa dan data sudah benar
            </label>
            {errors.confirmed && <p className="error-text">{errors.confirmed}</p>}
          </div>

          {/* Submit Button */}
          <div className="dashboard-form-action">
            <button type="submit" className="dashboard-button">
              Terbitkan Sertifikat
            </button>
          </div>

          {statusMsg && (
            <div className="dashboard-status">
              <p className={`status-text ${statusMsg.includes('✅') ? 'success' : 'error'}`}>
                {statusMsg}
              </p>
            </div>
          )}
        </form>

        <div className="dashboard-footer-wrapper">
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
