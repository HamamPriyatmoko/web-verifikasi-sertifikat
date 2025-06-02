// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import './App.css';

// import Login from './login/Login';
// import Register from './register/Register';
// import Dashboard from './page/dashboard/Dashboard';
// import Home from './landing/home.jsx';
// import DaftarSertifikat from './page/daftarsertifikat/DaftarSertifikat';
// import VerifikasiSertifikat from './page/verifikasi/VerifikasiSertifikat';

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />
//         <Route path="/dashboard" element={<Dashboard />} />
//         <Route path="/daftar" element={<DaftarSertifikat />} />
//         <Route path="/verifikasi" element={<VerifikasiSertifikat />}></Route>
//       </Routes>
//     </Router>
//   );
// }

// export default App;

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
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
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
