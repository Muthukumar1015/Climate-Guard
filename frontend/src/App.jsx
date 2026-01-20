import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import HeatwaveModule from './pages/HeatwaveModule';
import FloodModule from './pages/FloodModule';
import AirQualityModule from './pages/AirQualityModule';
import WaterQualityModule from './pages/WaterQualityModule';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import ReportForm from './pages/ReportForm';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import { useAuth } from './context/AuthContext';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="heatwave" element={<HeatwaveModule />} />
        <Route path="flood" element={<FloodModule />} />
        <Route path="air-quality" element={<AirQualityModule />} />
        <Route path="water-quality" element={<WaterQualityModule />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="reports" element={<Reports />} />
        <Route path="report/new" element={<ProtectedRoute><ReportForm /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default App;
