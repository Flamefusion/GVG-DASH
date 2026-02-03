import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
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
  const [showDeTech, setShowDeTech] = useState(true);
  const { darkMode } = useDashboard();

  const toggleChart = () => {
    setShowDeTech(!showDeTech);
  };

  const currentData = showDeTech ? deTechData : ihcData;
  const currentTitle = showDeTech ? '3DE Tech Vendor Top 10 Rejection' : 'IHC Vendor Top 10 Rejection';
  
  const total = currentData.reduce((acc, curr) => acc + curr.value, 0);

  const PercentageLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (value === 0) return null;
    const percentage = ((value / total) * 100).toFixed(1);
    const textX = x + width / 2;
    const textY = y + height / 2 + 5;

    return (
      <text x={textX} y={textY} fill="#fff" textAnchor="middle" fontSize={12} fontWeight="bold">
        {`${percentage}%`}
      </text>
    );
  };

  const ValueLabel = (props: any) => {
    const { x, y, width, value, index } = props;
    const color = COLORS[index % COLORS.length];
    return (
      <text x={x + width / 2} y={y - 5} fill={color} textAnchor="middle" fontSize={12} fontWeight="bold">
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
              ? 'linear-gradient(135deg, #8884d8 0%, #82ca9d 100%)'
              : 'linear-gradient(135deg, #8884d8 0%, #82ca9d 100%)',
            color: 'white',
            border: 'none',
          }}
        >
          <ChevronLeft size={16} />
          Toggle to {showDeTech ? 'IHC Vendor' : '3DE Tech Vendor'}
          <ChevronRight size={16} />
        </Button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={showDeTech ? 'deTech' : 'ihc'}
          initial={{ opacity: 0, x: showDeTech ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: showDeTech ? 50 : -50 }}
          transition={{ duration: 0.5 }}
        >
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={currentData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="0" stroke="transparent" />
              <XAxis
                dataKey="name"
                stroke={darkMode ? '#9ca3af' : '#6b7280'}
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                style={{ fontSize: '10px' }}
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
                }}
                cursor={{ fill: 'transparent' }}
              />
              <Bar
                dataKey="value"
                radius={[8, 8, 0, 0]}
              >
                {currentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <LabelList content={<ValueLabel />} position="top" />
                <LabelList content={<PercentageLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};