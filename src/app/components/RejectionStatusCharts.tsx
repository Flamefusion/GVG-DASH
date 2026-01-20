
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDashboard } from '@/app/contexts/DashboardContext';

interface ChartData {
  name: string;
  value: number;
}

interface RejectionStatusChartsProps {
  acceptedVsRejected: ChartData[];
  rejectionBreakdown: ChartData[];
}

export const RejectionStatusCharts: React.FC<RejectionStatusChartsProps> = ({ acceptedVsRejected, rejectionBreakdown }) => {
  const { darkMode } = useDashboard();
  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#3b82f6'];
  const BREAKDOWN_COLORS = ['#f59e0b', '#8b5cf6', '#06b6d4'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Accepted vs. Rejected</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={acceptedVsRejected}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {acceptedVsRejected.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Rejection Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={rejectionBreakdown}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {rejectionBreakdown.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
