
import React, { useState, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Download } from 'lucide-react';
import { downloadChartAsImage } from '@/app/components/ui/utils';

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
  const [expandedChart, setExpandedChart] = useState<'vqc' | 'ft' | 'cs' | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ffbb28', '#ff8042', '#ff7300', '#34a853'];

  const handleDownload = () => {
    if (chartRef.current) {
      const svg = chartRef.current.querySelector('svg');
      const title = expandedChart === 'vqc' ? 'top_10_vqc_rejections' : expandedChart === 'ft' ? 'top_5_ft_rejections' : 'top_5_cs_rejections';
      downloadChartAsImage(svg, `${title}_${new Date().getTime()}`);
    }
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, expanded }) => {
    if (!expanded || percent === 0) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight="bold">
        {`${value} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  const renderPieChart = (data: ChartData[], title: string, color: string, expanded = false) => (
    <div ref={expanded ? chartRef : null} className="w-full h-full">
      <ResponsiveContainer width="100%" height={expanded ? "100%" : 300}>
        <PieChart>
          <Pie 
            data={data} 
            dataKey="value" 
            nameKey="name" 
            cx="50%" 
            cy="50%" 
            outerRadius={expanded ? 200 : 80} 
            fill={color} 
            labelLine={!expanded}
            label={expanded ? (props) => renderCustomLabel({ ...props, expanded }) : true}
          >
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: darkMode ? '#0a0a0a' : '#fff',
              border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #ccc',
              borderRadius: '8px',
              color: darkMode ? '#fff' : '#000'
            }}
            itemStyle={{ color: darkMode ? '#fff' : '#000' }}
          />
          <Legend 
            layout={expanded ? "horizontal" : "vertical"} 
            align={expanded ? "center" : "right"} 
            verticalAlign={expanded ? "bottom" : "top"} 
            wrapperStyle={expanded ? { paddingTop: '20px' } : { fontSize: '10px', maxWidth: '30%' }} 
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onDoubleClick={() => setExpandedChart('vqc')}
          className={`rounded-2xl p-6 shadow-lg border cursor-zoom-in transition-all hover:ring-2 hover:ring-blue-500/50 ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent'}`}
        >
          <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Top 10 VQC Rejections</h3>
          {renderPieChart(topVqcRejections, 'Top 10 VQC Rejections', '#8884d8')}
        </div>
        
        <div 
          onDoubleClick={() => setExpandedChart('ft')}
          className={`rounded-2xl p-6 shadow-lg border cursor-zoom-in transition-all hover:ring-2 hover:ring-blue-500/50 ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent'}`}
        >
          <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Top 5 FT Rejections</h3>
          {renderPieChart(topFtRejections, 'Top 5 FT Rejections', '#82ca9d')}
        </div>
        
        <div 
          onDoubleClick={() => setExpandedChart('cs')}
          className={`rounded-2xl p-6 shadow-lg border cursor-zoom-in transition-all hover:ring-2 hover:ring-blue-500/50 ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent'}`}
        >
          <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Top 5 CS Rejections</h3>
          {renderPieChart(topCsRejections, 'Top 5 CS Rejections', '#ffc658')}
        </div>
      </div>

      <Dialog open={!!expandedChart} onOpenChange={(open) => !open && setExpandedChart(null)}>
        <DialogContent className={`max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] flex flex-col p-8 ${darkMode ? 'bg-neutral-950 border-white/10' : 'bg-white'}`}>
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {expandedChart === 'vqc' ? 'Top 10 VQC Rejections' : expandedChart === 'ft' ? 'Top 5 FT Rejections' : 'Top 5 CS Rejections'} (Expanded View)
            </DialogTitle>
            <Button onClick={handleDownload} variant="outline" className="mr-10 flex items-center gap-2">
              <Download size={16} /> Download PNG
            </Button>
          </DialogHeader>
          <div className="flex-1 w-full mt-6 min-h-0">
            {expandedChart === 'vqc' ? renderPieChart(topVqcRejections, 'Top 10 VQC Rejections', '#8884d8', true) : 
             expandedChart === 'ft' ? renderPieChart(topFtRejections, 'Top 5 FT Rejections', '#82ca9d', true) : 
             renderPieChart(topCsRejections, 'Top 5 CS Rejections', '#ffc658', true)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
