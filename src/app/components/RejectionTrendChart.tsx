
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { rejectionTrendData } from '@/app/mockData';

export const RejectionTrendChart: React.FC = () => {
  const { darkMode } = useDashboard();

  return (
    <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Rejection Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={rejectionTrendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
          <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="rejected" stroke="#ef4444" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
