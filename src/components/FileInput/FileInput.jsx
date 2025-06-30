// src/components/FileInput/FileInput.jsx
import React from 'react';
import { FaFilePdf, FaUpload, FaTrash } from 'react-icons/fa';
import './FileInput.css';

export default function FileInput({ name, label, fileName, onChange, onClear, error }) {
  const fileId = `file-input-${name}`;

  return (
    <div className="file-input-wrapper">
      <label htmlFor={fileId} className="file-input-label">
        {label}
      </label>
      <div className={`file-drop-zone ${error ? 'error' : ''} ${fileName ? 'has-file' : ''}`}>
        <input
          type="file"
          id={fileId}
          name={name}
          accept="application/pdf"
          onChange={onChange}
          style={{ display: 'none' }}
        />
        {!fileName ? (
          <label htmlFor={fileId} className="file-drop-label">
            <FaUpload />
            <span>Klik untuk memilih atau jatuhkan file di sini</span>
          </label>
        ) : (
          <div className="file-preview">
            <FaFilePdf className="file-preview-icon" />
            <span className="file-preview-name">{fileName}</span>
            <button type="button" onClick={onClear} className="file-clear-btn">
              <FaTrash />
            </button>
          </div>
        )}
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
