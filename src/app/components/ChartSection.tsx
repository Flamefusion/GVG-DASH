import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useDashboard } from '@/app/contexts/DashboardContext';

export const ChartSection: React.FC = () => {
  const [showVQC, setShowVQC] = useState(true);
  const { vqcWipChart, ftWipChart, loading, error, darkMode, filters } = useDashboard();
  const vqcWipCount = vqcWipChart.reduce((acc, cur) => acc + cur.count, 0);
  const ftWipCount = ftWipChart.reduce((acc, cur) => acc + cur.count, 0);

  const isWabiSabi = filters.stage === 'WABI SABI';

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

  const currentData = isWabiSabi ? vqcWipChart : (showVQC ? vqcWipChart : ftWipChart);
  const currentTitle = isWabiSabi ? 'WABI SABI WIP SKU WISE' : (showVQC ? 'VQC WIP SKU WISE' : 'FT WIP SKU WISE');
  const barColor = isWabiSabi ? '#fb923c' : (showVQC ? '#f59e0b' : '#10b981');

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
    <div className={`rounded-2xl p-6 shadow-lg border ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent'}`}>
      <div className="mb-6 flex items-center justify-between">
        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentTitle}</h3>
        {!isWabiSabi && (
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
        )}
      </div>
      <div className="flex justify-center gap-4 mb-4">
        {isWabiSabi ? (
          <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>WABI SABI WIP</p>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{vqcWipCount}</p>
          </div>
        ) : (
          showVQC ? (
            <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>VQC WIP</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{vqcWipCount}</p>
            </div>
          ) : (
            <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>FT WIP</p>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{ftWipCount}</p>
            </div>
          )
        )}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={isWabiSabi ? 'wabi' : (showVQC ? 'vqc' : 'ft')}
          initial={{ opacity: 0, x: (isWabiSabi || showVQC) ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: (isWabiSabi || showVQC) ? 50 : -50 }}
          transition={{ duration: 0.5 }}
        >
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={currentData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="0" stroke="transparent" />
              <XAxis
                dataKey="sku"
                stroke={darkMode ? '#a3a3a3' : '#737373'}
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                interval={0}
                height={40}
              />
              <YAxis
                stroke={darkMode ? '#a3a3a3' : '#737373'}
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#0a0a0a' : '#fff',
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