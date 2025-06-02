// Komponen tombol verifikasi yang reusable
const VerifyButton = ({ text, onClick, disabled, loading }) => (
  <button className="verifikasi-verify-btn" onClick={onClick} disabled={disabled}>
    {loading ? <span className="loading-spinner"></span> : text}
  </button>
);

export default VerifyButton;