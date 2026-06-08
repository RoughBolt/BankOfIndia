import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import UploadPage from './pages/UploadPage';
import DashboardPage from './pages/DashboardPage';
import ScanDetailPage from './pages/ScanDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/scan/:scanId" element={<ScanDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
