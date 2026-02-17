
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

interface RejectionStatusChartsProps {
  acceptedVsRejected: ChartData[];
  rejectionBreakdown: ChartData[];
}

const renderBreakdownLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, expanded }) => {
  const RADIAN = Math.PI / 180;
  const radius = expanded ? innerRadius + (outerRadius - innerRadius) * 0.5 : innerRadius + (outerRadius - innerRadius) * 0.4;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent === 0) return null;

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={expanded ? 16 : 12} fontWeight="bold">
      {`${value} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};


export const RejectionStatusCharts: React.FC<RejectionStatusChartsProps> = ({ acceptedVsRejected, rejectionBreakdown }) => {
  const { darkMode, filters } = useDashboard();
  const [expandedChart, setExpandedChart] = useState<'status' | 'breakdown' | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  
  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#3b82f6'];
  const BREAKDOWN_COLORS = ['#f59e0b', '#8b5cf6', '#06b6d4'];
  
  const isRT = filters.stage === 'RT' || filters.stage === 'RT CS';
  const showBreakdown = filters.stage === 'VQC' && !isRT;

  const handleDownload = () => {
    if (chartRef.current) {
      const svg = chartRef.current.querySelector('svg');
      const title = expandedChart === 'status' ? 'accepted_vs_rejected' : 'rejection_breakdown';
      downloadChartAsImage(svg, `${title}_${new Date().getTime()}`);
    }
  };

  const renderAcceptedVsRejectedLabel = ({ cx, cy, midAngle, outerRadius, percent, value, name, innerRadius, fill, expanded }) => {
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    const radiusInside = innerRadius + (outerRadius - innerRadius) * 0.5;
    const xInside = cx + radiusInside * Math.cos(-midAngle * RADIAN);
    const yInside = cy + radiusInside * Math.sin(-midAngle * RADIAN);

    return (
      <g>
        <text x={xInside} y={yInside} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold" fontSize={expanded ? 16 : 12}>
          {`${(percent * 100).toFixed(0)}%`}
        </text>
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill={fill} dominantBaseline="central" fontSize={expanded ? 14 : 12}>
          {`${name} (${value})`}
        </text>
      </g>
    );
  };

  const renderStatusChart = (expanded = false) => (
    <div ref={expanded ? chartRef : null} className="w-full h-full">
      <ResponsiveContainer width="100%" height={expanded ? "100%" : 300}>
        <PieChart>
          <Pie
            data={acceptedVsRejected}
            cx="50%"
            cy="50%"
            innerRadius={expanded ? 120 : 90}
            outerRadius={expanded ? 200 : 130}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
            nameKey="name"
            labelLine={false}
            label={(props) => renderAcceptedVsRejectedLabel({ ...props, expanded })}
          >
            {acceptedVsRejected.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
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
          {expanded && <Legend verticalAlign="bottom" height={36} />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  const renderBreakdownChart = (expanded = false) => (
    <div ref={expanded ? chartRef : null} className="w-full h-full">
      <ResponsiveContainer width="100%" height={expanded ? "100%" : 300}>
        <PieChart>
          <Pie
            data={rejectionBreakdown}
            cx="50%"
            cy="50%"
            outerRadius={expanded ? 200 : 130}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            labelLine={false}
            label={(props) => renderBreakdownLabel({ ...props, expanded })}
          >
            {rejectionBreakdown.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length]} />
            ))}
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
          <Legend verticalAlign={expanded ? "bottom" : "middle"} align={expanded ? "center" : "right"} layout={expanded ? "horizontal" : "vertical"} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <>
      <div className={`grid gap-6 ${!showBreakdown ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        <div 
          onDoubleClick={() => setExpandedChart('status')}
          className={`rounded-2xl p-6 shadow-lg border cursor-zoom-in transition-all hover:ring-2 hover:ring-blue-500/50 ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent'}`}
        >
          <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Accepted vs. Rejected</h3>
          {renderStatusChart(false)}
        </div>
        
        {showBreakdown && (
          <div 
            onDoubleClick={() => setExpandedChart('breakdown')}
            className={`rounded-2xl p-6 shadow-lg border cursor-zoom-in transition-all hover:ring-2 hover:ring-blue-500/50 ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent'}`}
          >
            <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Rejection Breakdown</h3>
            {renderBreakdownChart(false)}
          </div>
        )}
      </div>

      <Dialog open={!!expandedChart} onOpenChange={(open) => !open && setExpandedChart(null)}>
        <DialogContent className={`max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] flex flex-col p-8 ${darkMode ? 'bg-neutral-950 border-white/10' : 'bg-white'}`}>
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {expandedChart === 'status' ? 'Accepted vs. Rejected' : 'Rejection Breakdown'} (Expanded View)
            </DialogTitle>
            <Button onClick={handleDownload} variant="outline" className="mr-10 flex items-center gap-2">
              <Download size={16} /> Download PNG
            </Button>
          </DialogHeader>
          <div className="flex-1 w-full mt-6 min-h-0">
            {expandedChart === 'status' ? renderStatusChart(true) : renderBreakdownChart(true)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
