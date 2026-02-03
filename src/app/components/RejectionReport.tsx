import React, { useEffect, useState } from 'react';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { format } from 'date-fns';
import { KPICard } from '@/app/components/KPICard';
import { Button } from '@/app/components/ui/button';
import { Download, AlertCircle, Layers, Disc, Activity, Sparkles, AlertTriangle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Card, CardContent } from '@/app/components/ui/card';
import { Skeleton } from '@/app/components/ui/skeleton';

interface RejectionKPIs {
  "TOTAL REJECTIONS": number;
  "ASSEMBLY": number;
  "CASTING": number;
  "FUNCTIONAL": number;
  "POLISHING": number;
  "SHELL": number;
  [key: string]: number;
}

interface TableRowData {
  stage: string;
  rejection_type: string;
  total: number;
  [date: string]: number | string;
}

interface RejectionData {
  kpis: RejectionKPIs;
  table_data: TableRowData[];
  dates: string[];
}

export const RejectionReport: React.FC = () => {
  const { reportFilters, darkMode } = useDashboard();
  const [data, setData] = useState<RejectionData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (reportFilters.dateRange.from) queryParams.append('start_date', format(reportFilters.dateRange.from, 'yyyy-MM-dd'));
        if (reportFilters.dateRange.to) queryParams.append('end_date', format(reportFilters.dateRange.to, 'yyyy-MM-dd'));
        queryParams.append('vendor', reportFilters.vendor);

        const apiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080';
        const response = await fetch(`${apiUrl}/rejection-report-data?${queryParams.toString()}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error fetching rejection report data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reportFilters]);

  const handleExport = () => {
    if (!data) return;

    const dateHeaders = data.dates.map(d => format(new Date(d), 'dd-MMM-yy'));
    const headers = ['Stage', 'Rejection Type', ...dateHeaders, 'Total'];
    
    // Create CSV content
    const csvRows = [headers.join(',')];
    
    data.table_data.forEach(row => {
      const rowValues = [
        row.stage,
        `"${row.rejection_type}"`, // Quote to handle commas in text
        ...data.dates.map(d => row[d] || 0),
        row.total
      ];
      csvRows.push(rowValues.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = reportFilters.dateRange.from 
      ? format(reportFilters.dateRange.from, 'MMMM_yyyy')
      : 'ALL_TIME';
    link.setAttribute('download', `@${dateStr} month data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const kpiList = [
    { title: 'TOTAL REJECTIONS', key: 'TOTAL REJECTIONS', icon: AlertCircle, color: '#ef4444' },
    { title: 'ASSEMBLY', key: 'ASSEMBLY', icon: Layers, color: '#f59e0b' },
    { title: 'CASTING', key: 'CASTING', icon: Disc, color: '#ec4899' },
    { title: 'FUNCTIONAL', key: 'FUNCTIONAL', icon: Activity, color: '#ef4444' },
    { title: 'POLISHING', key: 'POLISHING', icon: Sparkles, color: '#14b8a6' },
    { title: 'SHELL', key: 'SHELL', icon: AlertTriangle, color: '#6366f1' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-10">No data available</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex justify-end mb-4">
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiList.map((item) => (
          <KPICard
            key={item.key}
            title={item.title}
            value={data.kpis[item.key] || 0}
            icon={item.icon}
            color={item.color}
            change=""
            onClick={() => {}}
          />
        ))}
      </div>

      <Card className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className={darkMode ? 'border-gray-700 hover:bg-gray-800' : ''}>
                <TableHead className={`w-[150px] font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Stage</TableHead>
                <TableHead className={`w-[250px] font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Rejection Type</TableHead>
                {data.dates.map(d => (
                  <TableHead key={d} className={`text-center font-bold whitespace-nowrap ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {format(new Date(d), 'dd-MMM-yy')}
                  </TableHead>
                ))}
                <TableHead className={`text-right font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.table_data.map((row, index) => (
                <TableRow key={`${row.stage}-${row.rejection_type}-${index}`} className={darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                  <TableCell className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row.stage}</TableCell>
                  <TableCell className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{row.rejection_type}</TableCell>
                  {data.dates.map(d => (
                    <TableCell key={d} className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {row[d] || 0}
                    </TableCell>
                  ))}
                  <TableCell className={`text-right font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{row.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
