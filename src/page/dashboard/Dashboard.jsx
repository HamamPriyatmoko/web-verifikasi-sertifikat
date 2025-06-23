// Dashboard.jsx
import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import './Dashboard.css';
import Footer from '../../components/Footer';

const initialState = {
  nim: '',
  nama: '',
  universitas: '',
  jurusan: '',
  tanggalTerbit: '',
};

const initialFiles = {
  pdf_perpustakaan: null,
  pdf_laboratorium: null,
  pdf_keuangan: null,
  pdf_skripsi: null,
  pdf_toefl: null,
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
      setStatusMsg('Maaf Data Belum Lengkap Silahkan Isi Terlebih Dahulu.');
      return;
    }

    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      Object.entries(fileData).forEach(([k, f]) => fd.append(k, f));

      const uploadPromise = fetch('http://127.0.0.1:5000/sertifikat', {
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

      setFormData(initialState);
      setFileData(initialFiles);
      setConfirmed(false);
      setErrors({});
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
            minWidth: '350px', // lebih lebar
            padding: '16px 24px',
            color: '#788286', // teks putih
            background: 'rgba(85, 169, 224, 0.34)', // biru laut
            borderRadius: '8px',
            boxShadow: '0 4px 14px rgba(0, 95, 153, 0.2)',
          },
          success: {
            iconTheme: {
              primary: '#FFFFFF',
              secondary: '#d1e8fd',
            },
          },
          error: {
            iconTheme: {
              primary: '#FFFFFF',
              secondary: '#D9534F',
            },
          },
        }}
      />
      <main className="dashboard-container">
        <div className="dashboard-header">
          <h2 className="dashboard-heading">Terbitkan Sertifikat</h2>
        </div>

        <form onSubmit={handleSubmit} className="dashboard-form">
          <div className="dashboard-form-group">
            <label htmlFor="nim">NIM</label>
            <input
              id="nim"
              name="nim"
              value={formData.nim}
              onChange={handleChange}
              className={`dashboard-input ${errors.nim ? 'input-error' : ''}`}
            />
            {errors.nim && <p className="error-text">{errors.nim}</p>}
          </div>

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

          <div className="dashboard-form-group">
            <label htmlFor="tanggalTerbit">Tanggal Terbit</label>
            <input
              id="tanggalTerbit"
              name="tanggalTerbit"
              type="date"
              value={formData.tanggalTerbit}
              onChange={handleChange}
              className={`dashboard-input ${errors.tanggalTerbit ? 'input-error' : ''}`}
            />
            {errors.tanggalTerbit && <p className="error-text">{errors.tanggalTerbit}</p>}
          </div>

          {Object.keys(initialFiles).map((key) => (
            <div className="dashboard-form-group" key={key}>
              <label htmlFor={key}>
                {key.replace('pdf_', '').replace(/_/g, ' ').toUpperCase()}
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
                statusMsg.includes('✅') ? 'success' : statusMsg.includes('❌') ? 'error' : 'info'
              }`}>
              {' '}
              {statusMsg}{' '}
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
