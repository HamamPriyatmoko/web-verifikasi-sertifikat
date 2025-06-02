import React, { useState, useEffect } from 'react';
import './DaftarSertifikat.css';
import { FaSearch, FaFilter } from 'react-icons/fa';
import Footer from '../../components/Footer';
import DownloadPdfButton from '../../components/downloadpdf/DownloadPdfButton';

// Status badge color
const statusColor = {
  publish: '#4CAF50', // Green
  proses: '#FF9800', // Orange
};

const DaftarSertifikat = () => {
  const [sertifikatData, setSertifikatData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState('All');
  const [statusPublish, setStatusPublish] = useState('');

  // Ambil data dari API saat komponen mount
  useEffect(() => {
    fetch('http://127.0.0.1:5000/sertifikat')
      .then((res) => res.json())
      .then((data) => {
        setSertifikatData(data.sertifikat || []);
        setFilteredData(data.sertifikat || []);
      });
  }, []);

  // Filter Sertifikat
  const handleSearch = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    setFilteredData(sertifikatData.filter((item) => (item.nama && item.nama.toLowerCase().includes(term.toLowerCase())) || (item.email && item.email.toLowerCase().includes(term.toLowerCase()))));
  };

  // Filter berdasarkan Status
  const handleFilterStatus = (event) => {
    const status = event.target.value;
    setFilterStatus(status);
    if (status === 'All') {
      setFilteredData(sertifikatData);
    } else {
      setFilteredData(sertifikatData.filter((item) => (item.status_publish || '').toLowerCase() === status));
    }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredData.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  // Publish to Blockchain (Simulated)
  const publishToBlockchain = (id) => {
    setStatusPublish('Mempublikasikan...');

    fetch('http://localhost:5000/terbitkan_sertifikat_blockchain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sertifikat_id: id }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.transaction_hash) {
          setStatusPublish('Sukses! Sertifikat telah dipublikasikan ke blockchain.');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else if (data.error) {
          setStatusPublish('Gagal mempublikasikan: ' + data.error);
        } else {
          setStatusPublish('Terjadi kesalahan saat publish.');
        }
      })
      .catch((error) => {
        setStatusPublish('Gagal mempublikasikan: ' + error.message);
      });
  };

  function ButtonPublis({ status, id, address }) {
    if ((status || '').toLowerCase() === 'publish') {
      return <DownloadPdfButton address={address} className="ds-action-btn ds-download-btn" />;
    } else {
      return (
        <button className="ds-action-btn ds-publish-btn" onClick={() => publishToBlockchain(id)}>
          Publish
        </button>
      );
    }
  }

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
                  <input type="text" className="ds-search-bar" placeholder="Search by Name or Email" value={searchTerm} onChange={handleSearch} />
                </div>
                <div className="ds-filter-container">
                  <FaFilter className="ds-filter-icon" />
                  <select className="ds-filter-dropdown" value={filterStatus} onChange={handleFilterStatus}>
                    <option value="All">All</option>
                    <option value="publish">Publish</option>
                    <option value="proses">Proses</option>
                  </select>
                </div>
                <select className="ds-items-per-page" value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
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
                  <th>Tanggal Terbit</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="ds-user-photo" style={{ backgroundColor: '#007bff', color: '#fff' }}>
                        US
                      </div>
                    </td>
                    <td>{item.nama || '-'}</td>
                    <td>{item.jurusan || '-'}</td>
                    <td>{item.tanggal || '-'}</td>
                    <td>
                      <span className="ds-status-badge" style={{ backgroundColor: statusColor[(item.status_publish || '').toLowerCase()] || statusColor.proses }}>
                        {(item.status_publish || 'proses').charAt(0).toUpperCase() + (item.status_publish || 'proses').slice(1)}
                      </span>
                    </td>
                    <td>
                      <ButtonPublis status={item.status_publish} id={item.id} address={item.penerima} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="ds-pagination">
              {pageNumbers.map((number) => (
                <button key={number} className={`ds-page-btn ${currentPage === number ? 'ds-active' : ''}`} onClick={() => handlePageChange(number)}>
                  {number}
                </button>
              ))}
            </div>

            {statusPublish && <div className="ds-status-message">{statusPublish}</div>}
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
};

export default DaftarSertifikat;
