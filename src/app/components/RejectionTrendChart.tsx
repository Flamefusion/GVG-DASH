import React, { useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Download } from 'lucide-react';
import { downloadChartAsImage } from '@/app/components/ui/utils';

interface TrendData {
  day: string;
  rejected: number;
}

interface RejectionTrendChartProps {
  data: TrendData[];
}

export const RejectionTrendChart: React.FC<RejectionTrendChartProps> = ({ data }) => {
  const { darkMode } = useDashboard();
  const [isExpanded, setIsExpanded] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const chartData = data || [];

  const handleDownload = () => {
    if (chartRef.current) {
      const svg = chartRef.current.querySelector('svg');
      downloadChartAsImage(svg, `rejection_trend_${new Date().getTime()}`);
    }
  };

  const renderChartContent = (expanded = false) => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No rejection trend data available for the selected period.
          </p>
        </div>
      );
    }

    return (
      <div ref={expanded ? chartRef : null} className="w-full h-full">
        <ResponsiveContainer width="100%" height={expanded ? "100%" : 300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: expanded ? 40 : 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1a1a1a' : '#e5e7eb'} />
            <XAxis 
              dataKey="day" 
              stroke={darkMode ? '#a3a3a3' : '#737373'}
              tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              style={{ fontSize: expanded ? '14px' : '12px' }}
              height={expanded ? 60 : 30}
            />
            <YAxis stroke={darkMode ? '#a3a3a3' : '#737373'} style={{ fontSize: expanded ? '14px' : '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#0a0a0a' : '#fff',
                border: '1px solid #1a1a1a',
                borderRadius: '0.5rem',
                color: darkMode ? '#fff' : '#000',
              }}
              itemStyle={{ color: darkMode ? '#fff' : '#000' }}
              labelStyle={{ color: darkMode ? '#f3f4f6' : '#000000' }}
            />
            <Legend wrapperStyle={{ paddingTop: expanded ? '20px' : '0' }} />
            <Line 
              type="monotone" 
              dataKey="rejected" 
              name="Rejections"
              stroke="#ef4444" 
              strokeWidth={expanded ? 4 : 2}
              activeDot={{ r: expanded ? 10 : 8, strokeWidth: 2, fill: '#ef4444' }} 
              dot={{ stroke: '#ef4444', strokeWidth: 2, r: expanded ? 6 : 4 }}
            />
          </LineChart>
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
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Rejection Trend</h3>
        {renderChartContent(false)}
      </div>

      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className={`max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] flex flex-col p-8 ${darkMode ? 'bg-neutral-950 border-white/10' : 'bg-white'}`}>
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Rejection Trend (Expanded View)</DialogTitle>
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