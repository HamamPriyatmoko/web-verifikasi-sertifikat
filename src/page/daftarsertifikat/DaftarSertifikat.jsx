import React, { useState, useEffect } from 'react';
import './DaftarSertifikat.css';
import { FaSearch } from 'react-icons/fa';
import Footer from '../../components/Footer';
import DownloadPdfButton from '../../components/downloadpdf/DownloadPdfButton';

const DaftarSertifikat = () => {
  const [sertifikatData, setSertifikatData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch data sertifikat dari API
  useEffect(() => {
    fetch('http://127.0.0.1:5000/sertifikat')
      .then((res) => res.json())
      .then((data) => {
        setSertifikatData(data.sertifikat || []);
        setFilteredData(data.sertifikat || []);
      });
  }, []);

  // Search berdasarkan nama atau jurusan
  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    setFilteredData(
      sertifikatData.filter(
        (item) =>
          (item.nama && item.nama.toLowerCase().includes(term.toLowerCase())) ||
          (item.jurusan && item.jurusan.toLowerCase().includes(term.toLowerCase())),
      ),
    );
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredData.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  // Tampilkan inisial dari nama
  const getInitial = (nama) => {
    if (!nama) return '';
    const parts = nama.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <>
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
                    placeholder="Cari nama atau jurusan"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
                <select
                  className="ds-items-per-page"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}>
                  <option value={5}>Showing 5</option>
                  <option value={10}>Showing 10</option>
                  <option value={15}>Showing 15</option>
                </select>
              </div>
            </div>

            <table className="ds-daftar-table">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Nama</th>
                  <th>Jurusan</th>
                  <th>Universitas</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div
                        className="ds-user-photo"
                        style={{ backgroundColor: '#007bff', color: '#fff' }}>
                        {getInitial(item.nama)}
                      </div>
                    </td>
                    <td>{item.nama || '-'}</td>
                    <td>{item.jurusan || '-'}</td>
                    <td>{item.universitas || '-'}</td>
                    <td>
                      <DownloadPdfButton id={item.id} className="ds-action-btn ds-download-btn" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="ds-pagination">
              {pageNumbers.map((number) => (
                <button
                  key={number}
                  className={`ds-page-btn ${currentPage === number ? 'ds-active' : ''}`}
                  onClick={() => handlePageChange(number)}>
                  {number}
                </button>
              ))}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
};

export default DaftarSertifikat;
