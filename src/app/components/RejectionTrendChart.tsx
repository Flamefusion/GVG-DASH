import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDashboard } from '@/app/contexts/DashboardContext';

interface TrendData {
  day: string;
  rejected: number;
}

interface RejectionTrendChartProps {
  data: TrendData[];
}

export const RejectionTrendChart: React.FC<RejectionTrendChartProps> = ({ data }) => {
  const { darkMode } = useDashboard();

  const chartData = data || [];

  return (
    <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Rejection Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        {chartData.length > 0 ? (
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
            <XAxis 
              dataKey="day" 
              stroke={darkMode ? '#9ca3af' : '#6b7280'}
              tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#1f2937' : '#fff',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: darkMode ? '#f3f4f6' : '#111827' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="rejected" 
              name="Rejections"
              stroke="#ef4444" 
              strokeWidth={2}
              activeDot={{ r: 8, strokeWidth: 2, fill: '#ef4444' }} 
              dot={{ stroke: '#ef4444', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No rejection trend data available for the selected period.
            </p>
          </div>
        )}
      </ResponsiveContainer>
    </div>
  );
};