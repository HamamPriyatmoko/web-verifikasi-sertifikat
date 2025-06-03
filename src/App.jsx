import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Dashboard from './page/dashboard/Dashboard';
import Home from './landing/home';
import DaftarSertifikat from './page/daftarsertifikat/DaftarSertifikat';
import MainLayout from './components/MainLayout'; // sudah benar
import Verifikasi from './page/verifikasi/VerifikasiSertifikat';

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman dengan Navbar */}
        <Route path="/" element={<Home />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/daftar" element={<DaftarSertifikat />} />
          <Route path="/verifikasi" element={<Verifikasi />}></Route>
          {/* <Route path="/verifikasi" element={<VerifikasiSertifikat />} /> */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
