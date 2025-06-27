// src/pages/DaftarSertifikat.js
import React, { useState, useEffect } from 'react';
import './DaftarSertifikat.css';
import { FaSearch } from 'react-icons/fa';
import Footer from '../../components/Footer';
import DownloadPdfButton from '../../components/downloadpdf/DownloadPdfButton';

const DaftarSertifikat = () => {
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 1) Ambil semua data sertifikat
  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/sertifikat')
      .then((res) => res.json())
      .then(({ sertifikat = [] }) => {
        setAllData(sertifikat);
        setFilteredData(sertifikat);
      })
      .catch(console.error);
  }, []);

  // 2) Search/filter by nim atau universitas
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    const lower = term.toLowerCase();
    setFilteredData(
      allData.filter(
        (item) =>
          item.nim.toLowerCase().includes(lower) ||
          (item.universitas || '').toLowerCase().includes(lower),
      ),
    );
    setCurrentPage(1);
  };

  // 3) Pagination
  const lastIdx = currentPage * itemsPerPage;
  const firstIdx = lastIdx - itemsPerPage;
  const currentItems = filteredData.slice(firstIdx, lastIdx);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div id="daftar-page">
      <div className="ds-wrapper">
        <main className="ds-container">
          <div className="ds-header">
            <h2 className="ds-heading">Daftar Sertifikat</h2>
            <div className="ds-header-actions">
              <div className="ds-search-container">
                <FaSearch className="ds-search-icon" />
                <input
                  type="text"
                  className="ds-search-bar"
                  placeholder="Cari NIM atau universitas"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
              <select
                className="ds-items-per-page"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}>
                <option value={5}>5 per halaman</option>
                <option value={10}>10 per halaman</option>
                <option value={15}>15 per halaman</option>
              </select>
            </div>
          </div>

          <table className="ds-daftar-table">
            <thead>
              <tr>
                <th>NIM</th>
                <th>Universitas</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.nim}</td>
                  <td>{item.universitas || '-'}</td>
                  <td>
                    <DownloadPdfButton
                      nim={item.nim}
                      className="ds-action-btn ds-download-btn"
                      label="Download PDF"
                    />
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '1rem' }}>
                    Tidak ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination controls */}
          <div className="ds-pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                className={`ds-page-btn ${currentPage === num ? 'ds-active' : ''}`}
                onClick={() => setCurrentPage(num)}>
                {num}
              </button>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default DaftarSertifikat;
