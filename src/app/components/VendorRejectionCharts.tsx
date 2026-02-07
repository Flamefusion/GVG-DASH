import React, { useState, useMemo } from 'react';
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

type ChartView = 'deTech' | 'ihc' | 'combined';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ffbb28', '#ff7300', '#34a853', '#d93025'];

export const VendorRejectionCharts: React.FC<VendorRejectionChartsProps> = ({ deTechData, ihcData }) => {
  const [chartView, setChartView] = useState<ChartView>('deTech');
  const { darkMode } = useDashboard();

  const combinedData = useMemo(() => {
    const combined = new Map<string, number>();
    [...deTechData, ...ihcData].forEach(item => {
      combined.set(item.name, (combined.get(item.name) || 0) + item.value);
    });
    return Array.from(combined, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [deTechData, ihcData]);

  const toggleChart = () => {
    setChartView(prevView => {
      if (prevView === 'deTech') return 'ihc';
      if (prevView === 'ihc') return 'combined';
      return 'deTech';
    });
  };

  const { currentData, currentTitle, nextView } = useMemo(() => {
    switch (chartView) {
      case 'ihc':
        return { currentData: ihcData, currentTitle: 'IHC Vendor Top 10 Rejection', nextView: 'Combined' };
      case 'combined':
        return { currentData: combinedData, currentTitle: 'Combined Top 10 Rejections', nextView: '3DE Tech' };
      case 'deTech':
      default:
        return { currentData: deTechData, currentTitle: '3DE Tech Vendor Top 10 Rejection', nextView: 'IHC Vendor' };
    }
  }, [chartView, deTechData, ihcData, combinedData]);
  
  const total = currentData.reduce((acc, curr) => acc + curr.value, 0);

  const PercentageLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (value === 0) return null;
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
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
    <div className={`rounded-2xl p-6 shadow-lg border ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent'}`}>
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
          Toggle to {nextView}
          <ChevronRight size={16} />
        </Button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={chartView}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.5 }}
        >
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={currentData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="0" stroke="transparent" />
              <XAxis
                dataKey="name"
                stroke={darkMode ? '#a3a3a3' : '#737373'}
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                style={{ fontSize: '10px' }}
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
                itemStyle={{ color: darkMode ? '#fff' : '#000' }}
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