// src/page/daftarsertifikat/DaftarSertifikat.jsx (Versi Final dengan Dropdown)

import React, { useState, useEffect, useMemo } from 'react';
import { FaSearch, FaDownload } from 'react-icons/fa';
import { AiOutlineLoading } from 'react-icons/ai';
import { useDebounce } from '../../utils/useDebounce';
import './DaftarSertifikat.css';
import DownloadPdfButton from '../../components/ButtonDownload/DownloadPdfButton'; // Pastikan path ini benar

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export default function DaftarSertifikat() {
  const [allData, setAllData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // State ini sekarang akan terpakai
  const [loading, setLoading] = useState(true);

  // Gunakan debounce untuk menunda filtering saat pengguna mengetik
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/sertifikat`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { sertifikat = [] } = await res.json();
        setAllData(sertifikat);
      } catch (err) {
        console.error('❌ fetch error:', err);
        alert('Gagal memuat daftar sertifikat:\n' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Gunakan useMemo agar filtering hanya berjalan jika data atau search term berubah
  const filteredData = useMemo(() => {
    setCurrentPage(1); // Kembali ke halaman 1 setiap kali filter berubah
    if (!debouncedSearchTerm) return allData;
    const lower = debouncedSearchTerm.toLowerCase();
    return allData.filter(
      (item) =>
        item.nim.toLowerCase().includes(lower) ||
        (item.universitas || '').toLowerCase().includes(lower),
    );
  }, [allData, debouncedSearchTerm]);

  // Kalkulasi untuk pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const firstIdx = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredData.slice(firstIdx, firstIdx + itemsPerPage);

  // Handler untuk paginasi
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="ds-loading">
        <AiOutlineLoading className="ds-spinner" />
      </div>
    );
  }

  return (
    <div className="ds-container">
      <div className="ds-card">
        <header className="ds-header">
          <h2 className="ds-heading">Daftar Sertifikat</h2>
          <div className="ds-header-actions">
            <div className="ds-search-container">
              <FaSearch className="ds-search-icon" />
              <input
                type="text"
                className="ds-search-bar"
                placeholder="Cari NIM atau universitas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* ELEMEN DROPDOWN YANG DITAMBAHKAN KEMBALI */}
            <select
              className="ds-items-per-page"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Kembali ke halaman 1 saat item diubah
              }}>
              <option value={10}>10 per halaman</option>
              <option value={20}>20 per halaman</option>
              <option value={50}>50 per halaman</option>
            </select>
          </div>
        </header>

        <div className="ds-table-wrapper">
          <table className="ds-daftar-table">
            <thead>
              <tr>
                <th>NIM</th>
                <th>Universitas</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nim}</td>
                    <td>{item.universitas || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <DownloadPdfButton
                        nim={item.nim}
                        className="ds-action-btn"
                        label={
                          <>
                            <FaDownload size={12} />
                            <span>Download</span>
                          </>
                        }
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                    Tidak ada data yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="ds-pagination-footer">
          <span>
            Menampilkan <strong>{currentItems.length}</strong> dari{' '}
            <strong>{filteredData.length}</strong> data
          </span>
          {totalPages > 1 && (
            <div className="ds-pagination-controls">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}>
                Previous
              </button>
              <span>
                {' '}
                Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>{' '}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}
