// src/page/dashboard/Dashboard.jsx (Versi Final dengan Desain Input Baru)

import React, { useState } from 'react';
import Web3 from 'web3';
import toast, { Toaster } from 'react-hot-toast';

// Impor ikon tidak lagi diperlukan untuk form ini
import './Dashboard.css'; // Pastikan CSS baru sudah digunakan
import FileInput from '../../components/FileInput/FileInput';
import contractABI from '../../abi/BlockchainSertifikasi.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const initialState = {
  nim: '',
  nama: '',
  universitas: '',
  jurusan: '',
  nomerSertifikat: '',
  fakultas: '',
  tahunLulus: '',
};
const initialFiles = { file_ijazah: null, file_skpi: null };
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

const Dashboard = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialState);
  const [fileData, setFileData] = useState(initialFiles);
  const [errors, setErrors] = useState({});
  const [confirmed, setConfirmed] = useState(false);

  const validateStep = () => {
    const newErrors = {};
    if (step === 1) {
      [
        'nim',
        'nama',
        'universitas',
        'jurusan',
        'nomerSertifikat',
        'fakultas',
        'tahunLulus',
      ].forEach((field) => {
        if (!formData[field]) newErrors[field] = 'Wajib diisi';
      });
    }
    if (step === 2) {
      if (!fileData.file_ijazah) newErrors.file_ijazah = 'File Ijazah wajib diunggah';
      if (!fileData.file_skpi) newErrors.file_skpi = 'File SKPI wajib diunggah';
    }
    if (step === 3) {
      if (!confirmed) newErrors.confirmed = 'Anda harus menyetujui kebenaran data';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((s) => s + 1);
    } else {
      toast.error('Mohon lengkapi semua data pada langkah ini.');
    }
  };
  const prevStep = () => setStep((s) => s - 1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFileData({ ...fileData, [name]: files[0] });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleClearFile = (name) => {
    setFileData({ ...fileData, [name]: null });
  };

  const handleSubmit = async () => {
    if (!validateStep()) {
      toast.error('Mohon centang kotak konfirmasi untuk melanjutkan.');
      return;
    }
    const toastId = toast.loading('Memulai proses penerbitan...');

    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      Object.entries(fileData).forEach(([k, f]) => fd.append(k, f));

      toast.loading('1/2 Mengunggah file ke IPFS & Hashing...', { id: toastId });
      const res = await fetch(`${API_URL}/api/sertifikat`, { method: 'POST', body: fd });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Upload atau hashing gagal.');

      const { cidDetail, hashMetadata } = body;
      toast.loading('2/2 Menyiapkan transaksi blockchain... Mohon tunggu konfirmasi MetaMask.', {
        id: toastId,
      });

      if (!window.ethereum) throw new Error('MetaMask tidak terdeteksi. Harap install MetaMask.');
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const [account] = await web3.eth.getAccounts();
      const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

      await contract.methods
        .terbitkanSertifikat({
          nim: formData.nim,
          universitas: formData.universitas,
          cidDetail,
          hashMetadata,
          nomerSertifikat: formData.nomerSertifikat,
        })
        .send({ from: account });

      toast.success('Sertifikat berhasil diterbitkan ke blockchain!', {
        id: toastId,
        duration: 4000,
      });
      setStep(1);
      setFormData(initialState);
      setFileData(initialFiles);
      setConfirmed(false);
    } catch (err) {
      console.error(err);
      const message = err.code === 4001 ? 'Transaksi dibatalkan oleh pengguna.' : err.message;
      toast.error(`Gagal: ${message}`, { id: toastId, duration: 5000 });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        // Ini adalah JSX dengan struktur input yang baru dan lebih sederhana
        return (
          <>
            <h2 className="form-title">Langkah 1: Isi Data Mahasiswa</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nim">NIM</label>
                <input
                  id="nim"
                  name="nim"
                  type="text"
                  value={formData.nim}
                  onChange={handleChange}
                  className={`form-input ${errors.nim ? 'input-error' : ''}`}
                />
                {errors.nim && <p className="error-text">{errors.nim}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="nama">Nama Lengkap</label>
                <input
                  id="nama"
                  name="nama"
                  type="text"
                  value={formData.nama}
                  onChange={handleChange}
                  className={`form-input ${errors.nama ? 'input-error' : ''}`}
                />
                {errors.nama && <p className="error-text">{errors.nama}</p>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="universitas">Universitas</label>
                <select
                  id="universitas"
                  name="universitas"
                  value={formData.universitas}
                  onChange={handleChange}
                  className={`form-select ${errors.universitas ? 'input-error' : ''}`}>
                  <option value="">-- Pilih Universitas --</option>
                  {universitasList.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                {errors.universitas && <p className="error-text">{errors.universitas}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="jurusan">Jurusan</label>
                <select
                  id="jurusan"
                  name="jurusan"
                  value={formData.jurusan}
                  onChange={handleChange}
                  className={`form-select ${errors.jurusan ? 'input-error' : ''}`}>
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
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fakultas">Fakultas</label>
                <input
                  id="fakultas"
                  name="fakultas"
                  type="text"
                  value={formData.fakultas}
                  onChange={handleChange}
                  className={`form-input ${errors.fakultas ? 'input-error' : ''}`}
                />
                {errors.fakultas && <p className="error-text">{errors.fakultas}</p>}
              </div>
              <div className="form-group">
                <label htmlFor="tahunLulus">Tahun Lulus</label>
                <input
                  id="tahunLulus"
                  name="tahunLulus"
                  type="number"
                  value={formData.tahunLulus}
                  onChange={handleChange}
                  className={`form-input ${errors.tahunLulus ? 'input-error' : ''}`}
                />
                {errors.tahunLulus && <p className="error-text">{errors.tahunLulus}</p>}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="nomerSertifikat">Nomor Sertifikat</label>
              <input
                id="nomerSertifikat"
                name="nomerSertifikat"
                type="text"
                value={formData.nomerSertifikat}
                onChange={handleChange}
                className={`form-input ${errors.nomerSertifikat ? 'input-error' : ''}`}
              />
              {errors.nomerSertifikat && <p className="error-text">{errors.nomerSertifikat}</p>}
            </div>
          </>
        );
      case 2:
        return (
          <>
            <h2 className="form-title">Langkah 2: Unggah Dokumen</h2>
            <div className="file-upload-container">
              <div className="form-row-scrollable">
                <FileInput
                  name="file_ijazah"
                  label="File Ijazah (PDF)"
                  fileName={fileData.file_ijazah?.name}
                  onChange={handleFileChange}
                  onClear={() => handleClearFile('file_ijazah')}
                  error={errors.file_ijazah}
                />
                <FileInput
                  name="file_skpi"
                  label="File SKPI (PDF)"
                  fileName={fileData.file_skpi?.name}
                  onChange={handleFileChange}
                  onClear={() => handleClearFile('file_skpi')}
                  error={errors.file_skpi}
                />
              </div>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <h2 className="form-title">Langkah 3: Konfirmasi dan Terbitkan</h2>
            <div className="confirmation-summary">
              <h3 className="summary-title">
                Mohon periksa kembali semua data sebelum menerbitkan ke Blockchain. Proses ini tidak
                dapat diubah.
              </h3>
              <div className="summary-grid">
                {Object.entries(formData).map(([key, value]) => (
                  <React.Fragment key={key}>
                    <span className="summary-label">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}:
                    </span>
                    <span className="summary-value">{value}</span>
                  </React.Fragment>
                ))}
                <span className="summary-label">File Ijazah:</span>
                <span className="summary-value">{fileData.file_ijazah?.name || 'N/A'}</span>
                <span className="summary-label">File SKPI:</span>
                <span className="summary-value">{fileData.file_skpi?.name || 'N/A'}</span>
              </div>
              <div className="confirm-checkbox">
                <input
                  type="checkbox"
                  id="confirm"
                  checked={confirmed}
                  onChange={(e) => {
                    setConfirmed(e.target.checked);
                    if (errors.confirmed) setErrors({ ...errors, confirmed: null });
                  }}
                />
                <label htmlFor="confirm">
                  Saya menyatakan semua data yang dimasukkan adalah benar dan siap untuk dicatat
                  secara permanen.
                </label>
              </div>
              {errors.confirmed && <p className="error-text">{errors.confirmed}</p>}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-page-content">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="dashboard-container">
        <div className="stepper">
          {['Data Mahasiswa', 'Unggah Dokumen', 'Konfirmasi'].map((label, index) => (
            <div
              key={label}
              className={`step ${step === index + 1 ? 'active' : ''} ${
                step > index + 1 ? 'completed' : ''
              }`}>
              <div className="step-number">{step > index + 1 ? '✓' : index + 1}</div>
              <div className="step-label">{label}</div>
            </div>
          ))}
        </div>
        <div className="dashboard-form">
          {renderStep()}
          <div className="form-navigation">
            <button className="form-button secondary" onClick={prevStep} disabled={step === 1}>
              Kembali
            </button>
            {step < 3 ? (
              <button className="form-button primary" onClick={nextStep}>
                Lanjutkan
              </button>
            ) : (
              <button className="form-button primary" onClick={handleSubmit}>
                Terbitkan ke Blockchain
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
