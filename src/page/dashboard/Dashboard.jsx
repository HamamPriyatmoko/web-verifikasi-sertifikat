import React, { useState } from 'react';
import './Dashboard.css';
import Footer from '../../components/Footer';

const Dashboard = () => {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    kursus: '',
    deskripsi: '',
    terbit: '',
  });

  const [errors, setErrors] = useState({
    nama: '',
    email: '',
    kursus: '',
    deskripsi: '',
    terbit: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nama) newErrors.nama = 'Nama lengkap tidak boleh kosong';
    if (!formData.email) newErrors.email = 'Email tidak boleh kosong';
    if (!formData.kursus) newErrors.kursus = 'Pilih kursus yang diikuti';
    if (!formData.deskripsi) newErrors.deskripsi = 'Deskripsi tidak boleh kosong';
    if (!formData.terbit) newErrors.terbit = 'Tanggal terbit tidak boleh kosong';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Data Form:', formData);
      // Lakukan aksi lain seperti mengirim data ke server
    }
  };

  return (
    <>
      <div id="dashboard-page">
        <main className="dashboard-container">
          <h2 className="dashboard-heading">Terbitkan Sertifikat</h2>
          <p className="dashboard-subtext">Isi data penerima sertifikat di bawah ini dengan lengkap dan benar.</p>

          <form onSubmit={handleSubmit} className="dashboard-form">
            <div className="dashboard-form-row">
              <div className="dashboard-form-group">
                <label htmlFor="nama">Nama Lengkap</label>
                <input id="nama" name="nama" type="text" placeholder="Contoh: Budi Santoso" value={formData.nama} onChange={handleChange} aria-label="Nama Lengkap" />
                {errors.nama && <p className="error-text">{errors.nama}</p>}
              </div>
              <div className="dashboard-form-group">
                <label htmlFor="email">Email Aktif</label>
                <input id="email" name="email" type="email" placeholder="Contoh: budi@email.com" value={formData.email} onChange={handleChange} aria-label="Email Aktif" />
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>
            </div>

            <div className="dashboard-form-group">
              <label htmlFor="kursus">Nama Kursus / Sertifikasi</label>
              <select id="kursus" name="kursus" value={formData.kursus} onChange={handleChange} aria-label="Nama Kursus">
                <option value="">-- Pilih Kursus --</option>
                <option value="React Developer Bootcamp">React Developer Bootcamp</option>
                <option value="Blockchain Certificate Mastery">Blockchain Certificate Mastery</option>
                <option value="UI/UX Design Fundamentals">UI/UX Design Fundamentals</option>
                <option value="Cybersecurity Essentials">Cybersecurity Essentials</option>
                <option value="Data Science with Python">Data Science with Python</option>
              </select>
              {errors.kursus && <p className="error-text">{errors.kursus}</p>}
            </div>

            <div className="dashboard-form-group">
              <label htmlFor="deskripsi">Deskripsi Singkat</label>
              <input id="deskripsi" name="deskripsi" type="text" placeholder="Contoh: Peserta aktif dengan hasil memuaskan" value={formData.deskripsi} onChange={handleChange} aria-label="Deskripsi Singkat" />
              {errors.deskripsi && <p className="error-text">{errors.deskripsi}</p>}
            </div>

            <div className="dashboard-form-group">
              <label htmlFor="terbit">Tanggal Terbit</label>
              <input id="terbit" name="terbit" type="date" value={formData.terbit} onChange={handleChange} aria-label="Tanggal Terbit" />
              {errors.terbit && <p className="error-text">{errors.terbit}</p>}
            </div>

            <div className="dashboard-form-action">
              <button type="submit">Terbitkan Sertifikat</button>
            </div>
          </form>
        </main>
      </div>
    </>
  );
};

export default Dashboard;
