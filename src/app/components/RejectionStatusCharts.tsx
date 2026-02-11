
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

const renderBreakdownLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.4;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent === 0) return null;

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12}>
      {`${value} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};


export const RejectionStatusCharts: React.FC<RejectionStatusChartsProps> = ({ acceptedVsRejected, rejectionBreakdown }) => {
  const { darkMode, filters } = useDashboard();
  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#3b82f6'];
  const BREAKDOWN_COLORS = ['#f59e0b', '#8b5cf6', '#06b6d4'];
  
  const isRT = filters.stage === 'RT' || filters.stage === 'RT CS';

  const renderAcceptedVsRejectedLabel = ({ cx, cy, midAngle, outerRadius, percent, value, name, innerRadius, fill }) => {
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

    // For the percentage inside
    const radiusInside = innerRadius + (outerRadius - innerRadius) * 0.5;
    const xInside = cx + radiusInside * Math.cos(-midAngle * RADIAN);
    const yInside = cy + radiusInside * Math.sin(-midAngle * RADIAN);

    return (
      <g>
        <text x={xInside} y={yInside} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold">
          {`${(percent * 100).toFixed(0)}%`}
        </text>
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill={fill} dominantBaseline="central">
          {`${name} (${value})`}
        </text>
      </g>
    );
  };


  return (
    <div className={`grid gap-6 ${isRT ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
      <div className={`rounded-2xl p-6 shadow-lg border ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent'}`}>
        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Accepted vs. Rejected</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={acceptedVsRejected}
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={130}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
              labelLine={false}
              label={renderAcceptedVsRejectedLabel}
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
          </PieChart>
        </ResponsiveContainer>
      </div>
      {!isRT && (
        <div className={`rounded-2xl p-6 shadow-lg border ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent'}`}>
          <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Rejection Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={rejectionBreakdown}
                cx="50%"
                cy="50%"
                outerRadius={130}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                labelLine={false}
                label={renderBreakdownLabel}
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
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
