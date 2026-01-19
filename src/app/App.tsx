import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardProvider } from '@/app/contexts/DashboardContext';
import { Home } from '@/app/pages/Home';

export default function App() {
  return (
    <DashboardProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </DashboardProvider>
  );
}