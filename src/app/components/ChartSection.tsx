import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useDashboard } from '@/app/contexts/DashboardContext';

export const ChartSection: React.FC = () => {
  const [showVQC, setShowVQC] = useState(true);
  const { vqcWipChart, ftWipChart, loading, error, darkMode } = useDashboard();
  const vqcWipCount = vqcWipChart.length;
  const ftWipCount = ftWipChart.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-lg text-gray-500 dark:text-gray-400">
        Loading chart data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-lg text-red-500">
        Error: {error}
      </div>
    );
  }

  const currentData = showVQC ? vqcWipChart : ftWipChart;
  const currentTitle = showVQC ? 'VQC WIP SKU WISE' : 'FT WIP SKU WISE';
  const barColor = showVQC ? '#f59e0b' : '#10b981';

  const toggleChart = () => {
    setShowVQC(!showVQC);
  };

  const CustomLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text x={x + width / 2} y={y - 10} fill={darkMode ? '#fff' : '#000'} textAnchor="middle" fontSize={12} fontWeight="bold">
        {value}
      </text>
    );
  };

  return (
    <div className={`rounded-2xl p-6 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="mb-6 flex items-center justify-between">
        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentTitle}</h3>
        <Button
          onClick={toggleChart}
          variant="outline"
          className="flex items-center gap-2"
          style={{
            background: darkMode
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
          }}
        >
          <ChevronLeft size={16} />
          Toggle to {showVQC ? 'FT WIP' : 'VQC WIP'}
          <ChevronRight size={16} />
        </Button>
      </div>
      <div className="flex justify-center gap-4 mb-4">
        <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>VQC WIP SKU WISE</p>
          <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{vqcWipCount}</p>
        </div>
        <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>FT WIP SKU WISE</p>
          <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{ftWipCount}</p>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={showVQC ? 'vqc' : 'ft'}
          initial={{ opacity: 0, x: showVQC ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: showVQC ? 50 : -50 }}
          transition={{ duration: 0.5 }}
        >
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={currentData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" stroke="transparent" />
              <XAxis
                dataKey="sku"
                stroke={darkMode ? '#9ca3af' : '#6b7280'}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke={darkMode ? '#9ca3af' : '#6b7280'}
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#1f2937' : '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  color: darkMode ? '#fff' : '#000',
                }}
              />
              <Bar
                dataKey="count"
                fill={barColor}
                radius={[8, 8, 0, 0]}
                label={<CustomLabel />}
              >
                {currentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={barColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};