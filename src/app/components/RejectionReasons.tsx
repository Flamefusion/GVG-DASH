
import React from 'react';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { rejectionReasons } from '@/app/mockData';

export const RejectionReasons: React.FC = () => {
  const { darkMode } = useDashboard();

  return (
    <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Rejection Reasons</h3>
      <div className="space-y-4">
        {Object.entries(rejectionReasons).map(([stage, reasons]) => (
          <div key={stage}>
            <h4 className={`text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{stage}</h4>
            <ul className={`list-disc list-inside mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {reasons.map((item, index) => (
                <li key={index}>
                  {item.reason}: {item.quantity}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
