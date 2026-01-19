import { Routes, Route } from 'react-router-dom';
import { DashboardProvider } from '@/app/contexts/DashboardContext';
import { Home } from '@/app/pages/Home';
import Analysis from '@/app/pages/Analysis';
import Report from '@/app/pages/Report';
import { Nav } from '@/app/components/Nav';

export default function App() {
  return (
    <DashboardProvider>
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </DashboardProvider>
  );
}