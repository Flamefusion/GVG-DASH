
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useDashboard } from '@/app/contexts/DashboardContext';

interface ChartData {
  name: string;
  value: number;
}

interface VendorRejectionChartsProps {
  deTechData: ChartData[];
  ihcData: ChartData[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ffbb28', '#ff7300', '#34a853', '#d93025'];

export const VendorRejectionCharts: React.FC<VendorRejectionChartsProps> = ({ deTechData, ihcData }) => {
  const { darkMode } = useDashboard();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>3DE Tech Vendor Top 10 Rejection</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={deTechData}>
            <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value">
              <LabelList dataKey="value" position="top" style={{ fill: darkMode ? 'white' : 'black' }} />
              {deTechData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>IHC Vendor Top 10 Rejection</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ihcData}>
            <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value">
              <LabelList dataKey="value" position="top" style={{ fill: darkMode ? 'white' : 'black' }} />
              {ihcData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
