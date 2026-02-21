import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { downloadChartAsImage } from '@/app/components/ui/utils';

interface ChartData {
  name: string;
  value: number;
}

interface VendorRejectionChartsProps {
  deTechData: ChartData[];
  ihcData: ChartData[];
  deTechTotal?: number;
  ihcTotal?: number;
  vqcTotal?: number;
  ftTotal?: number;
}

type ChartView = 'deTech' | 'ihc' | 'combined';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ffbb28', '#ff7300', '#34a853', '#d93025'];

export const VendorRejectionCharts: React.FC<VendorRejectionChartsProps> = ({ 
  deTechData, 
  ihcData,
  deTechTotal = 0,
  ihcTotal = 0,
  vqcTotal = 0,
  ftTotal = 0
}) => {
  const [chartView, setChartView] = useState<ChartView>('deTech');
  const [isExpanded, setIsExpanded] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const { darkMode, filters } = useDashboard();

  const isRT = filters.stage === 'RT' || filters.stage === 'RT CS';
  const isWabiSabi = filters.line === 'WABI SABI';
  const isNonVendor = isRT || isWabiSabi;

  const combinedData = useMemo(() => {
    if (isNonVendor) return [];
    const combined = new Map<string, number>();
    
    // Process all data points except "Others" for merging
    [...deTechData, ...ihcData].forEach(item => {
      if (item.name !== 'Others') {
        combined.set(item.name, (combined.get(item.name) || 0) + item.value);
      }
    });

    const sortedCombined = Array.from(combined, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    // Add a new "Others" for the combined view
    const totalCombined = deTechTotal + ihcTotal;
    const currentSum = sortedCombined.reduce((acc, curr) => acc + curr.value, 0);
    const othersVal = totalCombined - currentSum;
    
    if (othersVal > 0) {
      sortedCombined.push({ name: 'Others', value: othersVal });
    }
    
    return sortedCombined;
  }, [deTechData, ihcData, isNonVendor, deTechTotal, ihcTotal]);

  const toggleChart = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setChartView(prevView => {
      if (isNonVendor) {
        return prevView === 'deTech' ? 'ihc' : 'deTech';
      }
      if (prevView === 'deTech') return 'ihc';
      if (prevView === 'ihc') return 'combined';
      return 'deTech';
    });
  };

  const handleDownload = () => {
    if (chartRef.current) {
      const svg = chartRef.current.querySelector('svg');
      downloadChartAsImage(svg, `${currentTitle.replace(/\s+/g, '_').toLowerCase()}_${new Date().getTime()}`);
    }
  };

  const { currentData, currentTitle, nextView, currentTotal } = useMemo(() => {
    if (isNonVendor) {
      if (chartView === 'ihc') {
        return { 
          currentData: ihcData, 
          currentTitle: 'Overall Top 10 FT Rejections', 
          nextView: 'VQC Top 10',
          currentTotal: ftTotal
        };
      }
      return { 
        currentData: deTechData, 
        currentTitle: 'Overall Top 10 VQC Rejections', 
        nextView: 'FT Top 10',
        currentTotal: vqcTotal
      };
    }

    switch (chartView) {
      case 'ihc':
        return { currentData: ihcData, currentTitle: 'IHC Vendor Top 10 Rejection', nextView: 'Combined', currentTotal: ihcTotal };
      case 'combined':
        return { currentData: combinedData, currentTitle: 'Combined Top 10 Rejections', nextView: '3DE Tech', currentTotal: deTechTotal + ihcTotal };
      case 'deTech':
      default:
        return { currentData: deTechData, currentTitle: '3DE Tech Vendor Top 10 Rejection', nextView: 'IHC Vendor', currentTotal: deTechTotal };
    }
  }, [chartView, deTechData, ihcData, combinedData, isNonVendor, deTechTotal, ihcTotal, vqcTotal, ftTotal]);

  const stats = useMemo(() => {
    const top10Sum = currentData.filter(d => d.name !== 'Others').reduce((acc, curr) => acc + curr.value, 0);
    const top10Percent = currentTotal > 0 ? (top10Sum / currentTotal) * 100 : 0;
    const othersPercent = currentTotal > 0 ? 100 - top10Percent : 0;
    return {
      top10: top10Percent.toFixed(1),
      others: othersPercent.toFixed(1)
    };
  }, [currentData, currentTotal]);
  
  const HighlightingBar = (props: any) => {
    const { fill, x, y, width, height, value, expanded } = props;
    const percentage = currentTotal > 0 ? (value / currentTotal) * 100 : 0;
    const isWarning = !expanded && percentage > 10;

    return (
      <g>
        {isWarning ? (
          <motion.rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={fill}
            rx={8}
            ry={8}
            stroke="#ef4444"
            strokeWidth={3}
            animate={{ strokeOpacity: [1, 0.2, 1], shadowBlur: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        ) : (
          <rect x={x} y={y} width={width} height={height} fill={fill} rx={8} ry={8} />
        )}
      </g>
    );
  };

  const PercentageLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    if (value === 0) return null;
    const percentage = currentTotal > 0 ? ((value / currentTotal) * 100).toFixed(1) : 0;
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

  const renderChartContent = (expanded = false) => {
    const chartData = currentData.filter(item => item.name !== 'Others');
    return (
      <div ref={expanded ? chartRef : null} className="w-full h-full">
        <ResponsiveContainer width="100%" height={expanded ? "100%" : 350}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="0" stroke="transparent" />
            <XAxis
              dataKey="name"
              stroke={darkMode ? '#a3a3a3' : '#737373'}
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              style={{ fontSize: expanded ? '12px' : '10px' }}
            />
            <YAxis
              stroke={darkMode ? '#a3a3a3' : '#737373'}
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                const percentage = currentTotal > 0 ? ((value / currentTotal) * 100).toFixed(1) : 0;
                return [`${value} (${percentage}%)`, name];
              }}
              contentStyle={{
                backgroundColor: darkMode ? '#0a0a0a' : '#fff',
                border: 'none',
                borderRadius: '8px', boxSizing: 'border-box',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                color: darkMode ? '#fff' : '#000',
              }}
              itemStyle={{ color: darkMode ? '#fff' : '#000' }}
              cursor={{ fill: 'transparent' }}
            />
            <Bar
              dataKey="value"
              shape={<HighlightingBar expanded={expanded} />}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
              <LabelList content={<ValueLabel />} position="top" />
              <LabelList content={<PercentageLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <>
      <div 
        onDoubleClick={() => setIsExpanded(true)}
        className={`rounded-2xl p-6 shadow-lg border cursor-zoom-in transition-all hover:ring-2 hover:ring-blue-500/50 ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent'}`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentTitle}</h3>
          <div className="flex flex-col items-end gap-3">
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
            <div className={`p-3 rounded-xl border flex flex-col gap-1 min-w-[200px] ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Top 10 Rejection %</span>
                <span className={darkMode ? 'text-blue-400' : 'text-blue-600'}>{stats.top10}%</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Other Rejection %</span>
                <span className={darkMode ? 'text-emerald-400' : 'text-emerald-600'}>{stats.others}%</span>
              </div>
            </div>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={chartView}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.5 }}
          >
            {renderChartContent(false)}
          </motion.div>
        </AnimatePresence>
      </div>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className={`max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] flex flex-col p-8 ${darkMode ? 'bg-neutral-950 border-white/10' : 'bg-white'}`}>
          <DialogHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <DialogTitle className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{currentTitle}</DialogTitle>
              <Button
                onClick={toggleChart}
                variant="outline"
                className="flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #8884d8 0%, #82ca9d 100%)',
                  color: 'white',
                  border: 'none',
                }}
              >
                <ChevronLeft size={16} />
                Toggle to {nextView}
                <ChevronRight size={16} />
              </Button>
              <div className={`ml-4 p-3 rounded-xl border flex flex-row gap-6 ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex flex-col text-[10px] font-black uppercase tracking-widest">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Top 10 Rejection %</span>
                  <span className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{stats.top10}%</span>
                </div>
                <div className="flex flex-col text-[10px] font-black uppercase tracking-widest">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Other Rejection %</span>
                  <span className={`text-sm ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{stats.others}%</span>
                </div>
              </div>
            </div>
            <Button onClick={handleDownload} variant="outline" className="mr-10 flex items-center gap-2">
              <Download size={16} /> Download PNG
            </Button>
          </DialogHeader>
          <div className="flex-1 w-full mt-6 min-h-0">
            {renderChartContent(true)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
