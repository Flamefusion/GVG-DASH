import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardProvider } from '@/app/contexts/DashboardContext';
import { AuthProvider, useAuth } from '@/app/contexts/AuthContext';
import { Home } from '@/app/pages/Home';
import Analysis from '@/app/pages/Analysis';
import Report from '@/app/pages/Report';
import Forecast from '@/app/pages/Forecast';
import Search from '@/app/pages/Search';
import { Nav } from '@/app/components/Nav';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <DashboardProvider>
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/report" element={<Report />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route 
            path="/search" 
            element={
              <ProtectedRoute>
                <Search />
              </ProtectedRoute>
            } 
          />
        </Routes>
        <Analytics />
        <SpeedInsights />
      </DashboardProvider>
    </AuthProvider>
  );
}