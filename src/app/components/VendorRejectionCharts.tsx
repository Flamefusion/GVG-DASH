
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDashboard } from '@/app/contexts/DashboardContext';

interface ChartData {
  name: string;
  value: number;
}

interface VendorRejectionChartsProps {
  deTechData: ChartData[];
  ihcData: ChartData[];
}

export const VendorRejectionCharts: React.FC<VendorRejectionChartsProps> = ({ deTechData, ihcData }) => {
  const { darkMode } = useDashboard();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>3DE Tech Vendor Top 10 Rejection</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={deTechData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>IHC Vendor Top 10 Rejection</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ihcData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
