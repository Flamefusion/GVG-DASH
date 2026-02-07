import React from 'react';
import { useDashboard } from '@/app/contexts/DashboardContext';

// This component is currently unused or deprecated as data is fetched dynamically.
// If needed, it should be updated to accept data via props.
export const RejectionReasons: React.FC = () => {
  const { darkMode } = useDashboard();

  return (
    <div className={`rounded-2xl p-6 shadow-lg border ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent'}`}>
      <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Rejection Reasons</h3>
      <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
        Rejection analysis is now integrated into the main report view.
      </p>
    </div>
  );
};