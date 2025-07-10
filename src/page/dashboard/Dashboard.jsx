import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import toast, { Toaster } from 'react-hot-toast';

import './Dashboard.css';
import FileInput from '../../components/FileInput/FileInput';
import contractABI from '../../abi/BlockchainSertifikasi.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const API_URL = import.meta.env.VITE_API_BASE;

const initialState = {
  nim: '',
  nama: '',
  universitas: '',
  fakultas: '',
  jurusan: '',
  nomerSertifikat: '',
  tahunLulus: '',
};
const initialFiles = { file_ijazah: null, file_skpi: null };

const Dashboard = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialState);
  const [fileData, setFileData] = useState(initialFiles);
  const [errors, setErrors] = useState({});
  const [confirmed, setConfirmed] = useState(false);

  // State untuk menyimpan daftar dari API & item terpilih
  const [universitasList, setUniversitasList] = useState([]);
  const [fakultasList, setFakultasList] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);

  const [selectedUniversitas, setSelectedUniversitas] = useState('');
  const [selectedFakultas, setSelectedFakultas] = useState('');

  // State untuk status loading dropdown
  const [loadingUniversitas, setLoadingUniversitas] = useState(true);
  const [loadingFakultas, setLoadingFakultas] = useState(false);
  const [loadingJurusan, setLoadingJurusan] = useState(false);

  // useEffect untuk mengambil data universitas saat komponen pertama kali dimuat
  useEffect(() => {
    const fetchUniversitas = async () => {
      try {
        setLoadingUniversitas(true);
        const res = await fetch(`${API_URL}/api/universitas`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (!res.ok) throw new Error('Gagal mengambil daftar universitas');
        const data = await res.json();
        console.log(`Ini adalah datanya`, data);
        setUniversitasList(data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoadingUniversitas(false);
      }
    };
    fetchUniversitas();
  }, []);

  // useEffect untuk mengambil data fakultas SAAT universitas dipilih
  useEffect(() => {
    if (!selectedUniversitas) {
      setFakultasList([]);
      setJurusanList([]);
      return;
    }
    const fetchFakultas = async () => {
      try {
        setLoadingFakultas(true);
        const res = await fetch(`${API_URL}/api/universitas/${selectedUniversitas}/fakultas`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (!res.ok) throw new Error('Gagal mengambil daftar fakultas');
        const data = await res.json();
        setFakultasList(data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoadingFakultas(false);
      }
    };
    fetchFakultas();
  }, [selectedUniversitas]);

  // useEffect untuk mengambil data jurusan SAAT fakultas dipilih
  useEffect(() => {
    if (!selectedFakultas) {
      setJurusanList([]);
      return;
    }
    const fetchJurusan = async () => {
      try {
        setLoadingJurusan(true);
        const res = await fetch(`${API_URL}/api/fakultas/${selectedFakultas}/jurusan`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (!res.ok) throw new Error('Gagal mengambil daftar jurusan');
        const data = await res.json();
        setJurusanList(data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoadingJurusan(false);
      }
    };
    fetchJurusan();
  }, [selectedFakultas]);

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

  const handleDynamicSelectChange = (e) => {
    const { name, value } = e.target;
    const selectedId = value;
    let selectedName = '';

    const newFormData = { ...formData };

    if (name === 'universitas') {
      setSelectedUniversitas(selectedId);
      selectedName = universitasList.find((u) => u.id == selectedId)?.nama_universitas || '';
      newFormData.fakultas = '';
      newFormData.jurusan = '';
      setFakultasList([]);
      setJurusanList([]);
      setSelectedFakultas('');
    } else if (name === 'fakultas') {
      setSelectedFakultas(selectedId);
      selectedName = fakultasList.find((f) => f.id == selectedId)?.nama_fakultas || '';
      newFormData.jurusan = '';
      setJurusanList([]);
    } else if (name === 'jurusan') {
      // Here we just update the name in formData, no new fetching
      const selectedOption = e.target.options[e.target.selectedIndex];
      selectedName = selectedOption.text;
    }

    newFormData[name] = selectedName;
    setFormData(newFormData);
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
      console.log(formData);

      toast.loading('1/2 Mengunggah file ke IPFS & Hashing...', { id: toastId });
      const res = await fetch(`${API_URL}/api/sertifikat`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        method: 'POST',
        body: fd,
      });
      console.log(res);
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
      setSelectedUniversitas('');
      setSelectedFakultas('');
    } catch (err) {
      console.error(err);
      const message = err.code === 4001 ? 'Transaksi dibatalkan oleh pengguna.' : err.message;
      toast.error(`Gagal: ${message}`, { id: toastId, duration: 5000 });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
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
                  value={selectedUniversitas}
                  onChange={handleDynamicSelectChange}
                  disabled={loadingUniversitas}
                  className={`form-select ${errors.universitas ? 'input-error' : ''}`}>
                  <option value="">
                    {loadingUniversitas ? 'Memuat...' : '-- Pilih Universitas --'}
                  </option>
                  {universitasList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nama_universitas}
                    </option>
                  ))}
                </select>
                {errors.universitas && <p className="error-text">{errors.universitas}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="fakultas">Fakultas</label>
                <select
                  id="fakultas"
                  name="fakultas"
                  value={selectedFakultas}
                  onChange={handleDynamicSelectChange}
                  disabled={!selectedUniversitas || loadingFakultas}
                  className={`form-select ${errors.fakultas ? 'input-error' : ''}`}>
                  <option value="">{loadingFakultas ? 'Memuat...' : '-- Pilih Fakultas --'}</option>
                  {fakultasList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nama_fakultas}
                    </option>
                  ))}
                </select>
                {errors.fakultas && <p className="error-text">{errors.fakultas}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="jurusan">Jurusan</label>
                <select
                  id="jurusan"
                  name="jurusan"
                  value={jurusanList.find((j) => j.nama_jurusan === formData.jurusan)?.id || ''}
                  onChange={handleDynamicSelectChange}
                  disabled={!selectedFakultas || loadingJurusan}
                  className={`form-select ${errors.jurusan ? 'input-error' : ''}`}>
                  <option value="">{loadingJurusan ? 'Memuat...' : '-- Pilih Jurusan --'}</option>
                  {jurusanList.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nama_jurusan}
                    </option>
                  ))}
                </select>
                {errors.jurusan && <p className="error-text">{errors.jurusan}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="tahunLulus">Tahun Lulus</label>
                <input
                  id="tahunLulus"
                  name="tahunLulus"
                  type="number"
                  placeholder="Contoh: 2024"
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
