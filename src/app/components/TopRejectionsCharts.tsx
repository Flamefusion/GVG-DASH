
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDashboard } from '@/app/contexts/DashboardContext';

interface ChartData {
  name: string;
  value: number;
}

interface TopRejectionsChartsProps {
  topVqcRejections: ChartData[];
  topFtRejections: ChartData[];
  topCsRejections: ChartData[];
}

export const TopRejectionsCharts: React.FC<TopRejectionsChartsProps> = ({ topVqcRejections, topFtRejections, topCsRejections }) => {
  const { darkMode } = useDashboard();
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ffbb28', '#ff8042', '#ff7300', '#34a853'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Top 10 VQC Rejections</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={topVqcRejections} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
              {topVqcRejections.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Top 5 FT Rejections</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={topFtRejections} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#82ca9d" label>
              {topFtRejections.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Top 5 CS Rejections</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={topCsRejections} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#ffc658" label>
              {topCsRejections.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
