import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Package,
  CheckCircle,
  XCircle,
  TrendingUp,
  Download,
  AlertTriangle,
  Activity,
  Layers,
  Sparkles,
  Disc
} from 'lucide-react';
import { KPICard } from '@/app/components/KPICard';
import { ReportFilters } from '@/app/components/ReportFilters';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { Button } from '@/app/components/ui/button';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ScrollArea } from '@/app/components/ui/scroll-area';

interface RejectionDetail {
  name: string;
  value: number;
}

interface ReportData {
  kpis: {
    output: number;
    accepted: number;
    rejected: number;
  };
  rejections: {
    [category: string]: RejectionDetail[];
  };
}

const Report: React.FC = () => {
  const { darkMode } = useDashboard();
  const [filters, setFilters] = useState({
    dateRange: { from: null as Date | null, to: null as Date | null },
    vendor: 'all',
    stage: 'VQC'
  });
  const [data, setData] = useState<ReportData>({
    kpis: { output: 0, accepted: 0, rejected: 0 },
    rejections: {}
  });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.dateRange.from) queryParams.append('start_date', format(filters.dateRange.from, 'yyyy-MM-dd'));
      if (filters.dateRange.to) queryParams.append('end_date', format(filters.dateRange.to, 'yyyy-MM-dd'));
      queryParams.append('stage', filters.stage);
      queryParams.append('vendor', filters.stage === 'FT' ? 'all' : filters.vendor);

      const apiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/report-data?${queryParams.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const yieldValue = data.kpis.output > 0 ? Math.round((data.kpis.accepted / data.kpis.output) * 100) : 0;

  const mainKpis = [
    {
      title: 'OUTPUT',
      value: data.kpis.output,
      icon: Package,
      color: '#3b82f6',
    },
    {
      title: 'ACCEPTED',
      value: data.kpis.accepted,
      icon: CheckCircle,
      color: '#10b981',
    },
    {
      title: 'REJECTED',
      value: data.kpis.rejected,
      icon: XCircle,
      color: '#ef4444',
    },
    {
      title: 'YIELD',
      value: yieldValue,
      suffix: '%',
      icon: TrendingUp,
      color: '#8b5cf6',
    },
  ];

  const rejectionCategories = [
    { key: 'ASSEMBLY', title: 'ASSEMBLY', icon: Layers, color: '#f59e0b' },
    { key: 'CASTING', title: 'CASTING', icon: Disc, color: '#ec4899' },
    { key: 'FUNCTIONAL', title: 'FUNCTIONAL', icon: Activity, color: '#ef4444' },
    { key: 'SHELL', title: 'SHELL', icon: AlertTriangle, color: '#6366f1' },
    { key: 'POLISHING', title: 'POLISHING', icon: Sparkles, color: '#14b8a6' },
  ];

  const handleExport = () => {
    const dateStr = filters.dateRange.from 
      ? format(filters.dateRange.from, 'd-M-yy') + (filters.dateRange.to && filters.dateRange.to !== filters.dateRange.from ? ` to ${format(filters.dateRange.to, 'd-M-yy')}` : '')
      : 'ALL TIME';
    
    const vendorStr = filters.stage === 'FT' ? 'FT' : (filters.vendor === 'all' ? 'ALL VENDORS' : filters.vendor);
    
    let content = `*${filters.stage} REPORT FOR ${vendorStr} ${dateStr}*\n\n`;
    content += `OUTPUT - ${data.kpis.output}\n`;
    content += `${filters.stage} ACCEPTED - ${data.kpis.accepted}\n`;
    content += `${filters.stage} REJECTED - ${data.kpis.rejected}\n`;
    content += `YIELD - ${yieldValue}%\n\n`;

    rejectionCategories.forEach(cat => {
      const items = data.rejections[cat.key] || [];
      if (items.length > 0) {
        content += `*${cat.title} REJECTIONS :*\n`;
        items.forEach(item => {
          content += `${item.name} - ${item.value}\n`;
        });
        content += '\n';
      }
    });

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filters.stage}_REPORT_${vendorStr}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`min-h-screen p-8 transition-colors ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Reports
        </h1>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      <ReportFilters onFilterChange={handleFilterChange} />

      {/* Main KPIs - Compact */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {mainKpis.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="h-32" 
          >
            <KPICard
              title={card.title}
              value={card.value}
              change={card.suffix || ''}
              icon={card.icon}
              color={card.color}
              onClick={() => {}}
            />
          </motion.div>
        ))}
      </div>

      {/* Rejection Category KPIs - Detailed List */}
      <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Rejection Analysis</h2>
      <div className="grid grid-cols-5 gap-4 mb-8">
        {rejectionCategories.map((cat, index) => {
          const items = data.rejections[cat.key] || [];
          const total = items.reduce((acc, item) => acc + item.value, 0);
          
          return (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (index * 0.1) }}
            >
                            <Card className={`h-full flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className={`text-sm font-bold uppercase ${darkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                                  {cat.title}
                                </CardTitle>
                                <cat.icon className="h-4 w-4" style={{ color: cat.color }} />
                              </CardHeader>
                              <CardContent className="flex-1 flex flex-col">
                                <div className={`text-3xl font-extrabold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {total}
                                </div>
                                <div className="space-y-3">
                                  {items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-start text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                                      <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} font-medium`}>
                                        {item.name}
                                      </span>
                                      <span className={`${darkMode ? 'text-gray-100' : 'text-gray-900'} font-bold ml-2`}>
                                        {item.value}
                                      </span>
                                    </div>
                                  ))}
                                  {items.length === 0 && (
                                    <div className={`text-sm italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                      No rejections recorded
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>            </motion.div>
          );
        })}
      </div>
      
    </div>
  );
};

export default Report;