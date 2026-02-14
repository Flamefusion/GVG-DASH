import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardProvider } from '@/app/contexts/DashboardContext';
import { AuthProvider, useAuth } from '@/app/contexts/AuthContext';
import { Home } from '@/app/pages/Home';
import Analysis from '@/app/pages/Analysis';
import Report from '@/app/pages/Report';
import Forecast from '@/app/pages/Forecast';
import Search from '@/app/pages/Search';
import { Login } from '@/app/pages/Login';
import { Nav } from '@/app/components/Nav';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/report" element={<Report />} />
        <Route path="/forecast" element={<Forecast />} />
        <Route path="/search" element={<Search />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DashboardProvider>
        <AppContent />
        <Analytics />
        <SpeedInsights />
      </DashboardProvider>
    </AuthProvider>
  );
}