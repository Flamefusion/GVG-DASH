
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { deTechVendorRejections, ihcVendorRejections } from '@/app/mockData';

export const VendorRejectionCharts: React.FC = () => {
  const { darkMode } = useDashboard();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>3DE Tech Vendor Top 10 Rejection</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={deTechVendorRejections}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="vendor" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="rejected" stroke="#ef4444" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>IHC Vendor Top 10 Rejection</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={ihcVendorRejections}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="vendor" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="rejected" stroke="#ef4444" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
