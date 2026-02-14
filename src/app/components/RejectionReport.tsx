import React, { useEffect, useState } from 'react';
import { useDashboard, RejectionReportData } from '@/app/contexts/DashboardContext';
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

export const RejectionReport: React.FC = () => {
  const { reportFilters, darkMode, rejectionReportData, setRejectionReportData } = useDashboard();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // If we already have data, don't fetch again unless filters changed (handled by effect dependency)
      // Actually, we want to fetch on first load of this component if data is null
      if (rejectionReportData) {
         // Optimization: If you want it to refresh every time the tab is clicked, remove this check.
         // For now, we fetch if null.
      }
      
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (reportFilters.dateRange.from) queryParams.append('start_date', format(reportFilters.dateRange.from, 'yyyy-MM-dd'));
        if (reportFilters.dateRange.to) queryParams.append('end_date', format(reportFilters.dateRange.to, 'yyyy-MM-dd'));
        queryParams.append('stage', reportFilters.stage);
        queryParams.append('vendor', reportFilters.vendor);
        if (reportFilters.line) queryParams.append('line', reportFilters.line);
        if (reportFilters.selectedSizes && reportFilters.selectedSizes.length > 0) {
          reportFilters.selectedSizes.forEach(s => queryParams.append('size', s));
        }
        if (reportFilters.selectedSkus && reportFilters.selectedSkus.length > 0) {
          reportFilters.selectedSkus.forEach(s => queryParams.append('sku', s));
        }

        const apiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080';
        const response = await fetch(`${apiUrl}/rejection-report-data?${queryParams.toString()}`);
        if (response.ok) {
          const result = await response.json();
          setRejectionReportData(result);
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
    if (!rejectionReportData) return;

    const dateHeaders = rejectionReportData.dates.map(d => format(new Date(d), 'dd-MMM-yy'));
    const headers = ['Stage', 'Rejection Type', ...dateHeaders, 'Total'];
    
    // Create CSV content
    const csvRows = [headers.join(',')];
    
    rejectionReportData.table_data.forEach(row => {
      const rowValues = [
        row.stage,
        `"${row.rejection_type}"`, // Quote to handle commas in text
        ...rejectionReportData.dates.map(d => row[d] || 0),
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

  if (loading && !rejectionReportData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!rejectionReportData) return <div className="text-center py-10">No data available</div>;

  const totalRejections = rejectionReportData.kpis['TOTAL REJECTIONS'] || 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiList.map((item) => (
          <KPICard
            key={item.key}
            title={item.title}
            value={rejectionReportData.kpis[item.key] || 0}
            icon={item.icon}
            color={item.color}
            onClick={() => {}}
            percentage={item.key !== 'TOTAL REJECTIONS' ? (rejectionReportData.kpis[item.key] || 0) / totalRejections * 100 : undefined}
            percentageStyle="inline"
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
                {rejectionReportData.dates.map(d => (
                  <TableHead key={d} className={`text-center font-bold whitespace-nowrap ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {format(new Date(d), 'dd-MMM-yy')}
                  </TableHead>
                ))}
                <TableHead className={`text-right font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rejectionReportData.table_data.map((row, index) => (
                <TableRow key={`${row.stage}-${row.rejection_type}-${index}`} className={darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                  <TableCell className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row.stage}</TableCell>
                  <TableCell className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{row.rejection_type}</TableCell>
                  {rejectionReportData.dates.map(d => (
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
