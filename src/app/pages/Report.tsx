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
import { RejectionReport } from '@/app/components/RejectionReport';
import { CategoryReport } from '@/app/components/CategoryReport';
import { useDashboard, ReportData, RejectionDetail } from '@/app/contexts/DashboardContext';
import { Button } from '@/app/components/ui/button';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ScrollArea } from '@/app/components/ui/scroll-area';

const Report: React.FC = () => {
  const { darkMode, reportFilters, reportData, setReportData, rejectionReportData, categoryReportData, setCategoryReportData } = useDashboard();
  const [loading, setLoading] = useState(false);

  const fetchCategoryData = async (currentFilters: any) => {
    try {
      const queryParams = new URLSearchParams();
      if (currentFilters.dateRange.from) queryParams.append('start_date', format(currentFilters.dateRange.from, 'yyyy-MM-dd'));
      if (currentFilters.dateRange.to) queryParams.append('end_date', format(currentFilters.dateRange.to, 'yyyy-MM-dd'));
      queryParams.append('vendor', currentFilters.vendor);
      if (currentFilters.selectedSizes && currentFilters.selectedSizes.length > 0) {
        currentFilters.selectedSizes.forEach(s => queryParams.append('size', s));
      }
      if (currentFilters.selectedSkus && currentFilters.selectedSkus.length > 0) {
        currentFilters.selectedSkus.forEach(s => queryParams.append('sku', s));
      }
      if (currentFilters.line) {
        queryParams.append('line', currentFilters.line);
      }

      const apiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/category-report-data?${queryParams.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setCategoryReportData(result);
      }
    } catch (error) {
      console.error("Error fetching category report data:", error);
    }
  };

  const fetchData = async (currentFilters?: any) => {
    setLoading(true);
    const filtersToUse = currentFilters || reportFilters;
    
    if (filtersToUse.reportType === 'Category') {
      await fetchCategoryData(filtersToUse);
      setLoading(false);
      return;
    }

    try {
      const queryParams = new URLSearchParams();
      if (filtersToUse.dateRange.from) queryParams.append('start_date', format(filtersToUse.dateRange.from, 'yyyy-MM-dd'));
      if (filtersToUse.dateRange.to) queryParams.append('end_date', format(filtersToUse.dateRange.to, 'yyyy-MM-dd'));
      const isNonVendorStage = ['FT', 'RT', 'RT CS', 'WABI SABI'].includes(filtersToUse.stage);
      queryParams.append('stage', filtersToUse.stage);
      queryParams.append('vendor', isNonVendorStage ? 'all' : filtersToUse.vendor);
      if (filtersToUse.selectedSizes && filtersToUse.selectedSizes.length > 0) {
        filtersToUse.selectedSizes.forEach(s => queryParams.append('size', s));
      }
      if (filtersToUse.selectedSkus && filtersToUse.selectedSkus.length > 0) {
        filtersToUse.selectedSkus.forEach(s => queryParams.append('sku', s));
      }
      if (filtersToUse.line) {
        queryParams.append('line', filtersToUse.line);
      }

      const apiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/report-data?${queryParams.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setReportData(result);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if data is currently empty (initial state)
    if (reportFilters.reportType === 'Category') {
       fetchData();
    } else if (reportData.kpis.output === 0 && reportData.kpis.accepted === 0 && reportData.kpis.rejected === 0) {
      fetchData();
    }
  }, []);

  const handleApplyFilters = (filters?: any) => {
    fetchData(filters);
  };

  const totalProcessed = reportData.kpis.accepted + reportData.kpis.rejected;
  const yieldValue = totalProcessed > 0 ? ((reportData.kpis.accepted / totalProcessed) * 100).toFixed(2) : 0;

  const isWabiSabi = reportFilters.stage === 'WABI SABI';

  const mainKpis = [
    {
      title: 'OUTPUT',
      value: reportData.kpis.output,
      icon: Package,
      color: '#3b82f6',
      show: true,
    },
    {
      title: 'ACCEPTED',
      value: reportData.kpis.accepted,
      icon: CheckCircle,
      color: '#10b981', // Green
      show: true,
    },
    {
      title: 'REJECTED',
      value: reportData.kpis.rejected,
      icon: XCircle,
      color: '#ef4444', // Red
      show: true,
    },
    {
      title: 'YIELD',
      value: yieldValue,
      suffix: '%',
      icon: TrendingUp,
      color: '#8b5cf6',
      show: true,
    },
  ];

  const visibleKpis = mainKpis.filter(kpi => kpi.show);

  const rejectionCategories = [
    { key: 'ASSEMBLY', title: 'ASSEMBLY', icon: Layers, color: '#f59e0b' },
    { key: 'CASTING', title: 'CASTING', icon: Disc, color: '#ec4899' },
    { key: 'FUNCTIONAL', title: 'FUNCTIONAL', icon: Activity, color: '#ef4444' },
    { key: 'SHELL', title: 'SHELL', icon: AlertTriangle, color: '#6366f1' },
    { key: 'POLISHING', title: 'POLISHING', icon: Sparkles, color: '#14b8a6' },
  ];

  const handleExport = () => {
    const dateStr = reportFilters.dateRange.from 
      ? format(reportFilters.dateRange.from, 'd-M-yy') + (reportFilters.dateRange.to && reportFilters.dateRange.to !== reportFilters.dateRange.from ? ` to ${format(reportFilters.dateRange.to, 'd-M-yy')}` : '')
      : 'ALL TIME';
    
    const vendorStr = reportFilters.stage === 'FT' ? 'FT' : (reportFilters.vendor === 'all' ? 'ALL VENDORS' : reportFilters.vendor);
    
    let content = "";
    let fileName = "";

    if (reportFilters.reportType === 'Category' && categoryReportData) {
      // Category Report CSV
      fileName = `CATEGORY_REPORT_SUMMARY_${dateStr}.csv`;
      
      const outcomes = ["TOTAL REJECTION", "RT CONVERSION", "WABI SABI", "SCRAP"];
      const headerRow = ["Total Rejection", "Count", "", "RT Conversion", "Count", "", "Wabi Sabi", "Count", "", "Scrap", "Count"];
      content += headerRow.join(",") + "\n";

      // Collect all rejections for each outcome into lists
      const lists: { name: string; value: number }[][] = [[], [], [], []];
      const categories = ["ASSEMBLY", "CASTING", "FUNCTIONAL", "SHELL", "POLISHING"];

      outcomes.forEach((outcome, idx) => {
        categories.forEach(cat => {
          const data = categoryReportData.breakdown[outcome][cat];
          if (data && data.rejections.length > 0) {
            lists[idx].push(...data.rejections);
          }
        });
        // Sort descending by count
        lists[idx].sort((a, b) => b.value - a.value);
      });

      // Find max length
      const maxLen = Math.max(...lists.map(l => l.length));

      for (let i = 0; i < maxLen; i++) {
        const row = [];
        for (let j = 0; j < outcomes.length; j++) {
          const item = lists[j][i];
          if (item) {
            row.push(`"${item.name}"`, item.value);
          } else {
            row.push("", "");
          }
          if (j < outcomes.length - 1) row.push(""); // Gap column
        }
        content += row.join(",") + "\n";
      }

    } else if (reportFilters.reportType === 'Rejection' && rejectionReportData) {
      // Rejection Report CSV
      const dateHeaders = rejectionReportData.dates.map(d => format(new Date(d), 'dd-MMM-yy'));
      const headers = ['Stage', 'Rejection Type', 'Total', ...dateHeaders];
      const csvRows = [headers.join(',')];
      
      rejectionReportData.table_data.forEach(row => {
        const rowValues = [
          row.stage,
          `"${row.rejection_type}"`,
          row.total,
          ...rejectionReportData.dates.map(d => row[d] || 0)
        ];
        csvRows.push(rowValues.join(','));
      });
      content = csvRows.join('\n');
      const dateStrFile = reportFilters.dateRange.from ? format(reportFilters.dateRange.from, 'MMMM_yyyy') : 'ALL_TIME';
      fileName = `@${dateStrFile} month data.csv`;

    } else {
      // Daily Report CSV (Default)
      content = `*${reportFilters.stage} REPORT FOR ${vendorStr} ${dateStr}*\n\n`;
      content += `OUTPUT - ${reportData.kpis.output}\n`;
      content += `${reportFilters.stage} ACCEPTED - ${reportData.kpis.accepted}\n`;
      content += `${reportFilters.stage} REJECTED - ${reportData.kpis.rejected}\n`;
      content += `YIELD - ${yieldValue}%\n\n`;

      rejectionCategories.forEach(cat => {
        const items = reportData.rejections[cat.key] || [];
        if (items.length > 0) {
          content += `*${cat.title} REJECTIONS :*\n`;
          items.forEach(item => {
            content += `${item.name} - ${item.value}\n`;
          });
          content += '\n';
        }
      });
      fileName = `${reportFilters.stage}_REPORT_${vendorStr}_${dateStr}.csv`;
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`min-h-screen p-8 transition-colors ${darkMode ? 'bg-black' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Reports
        </h1>
        {(reportFilters.reportType === 'Daily' || reportFilters.reportType === 'Category' || reportFilters.reportType === 'Rejection') && (
          <Button onClick={handleExport} className="flex items-center gap-2">
            <Download size={16} />
            Export CSV
          </Button>
        )}
      </div>

      <ReportFilters onApply={handleApplyFilters} />

      {reportFilters.reportType === 'Rejection' ? (
        <RejectionReport />
      ) : reportFilters.reportType === 'Category' ? (
        <CategoryReport />
      ) : (
        <>
          {/* Main KPIs - Compact */}
          <div className={`grid gap-4 mb-10 ${visibleKpis.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {visibleKpis.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <KPICard
                  title={card.title}
                  value={card.value}
                  suffix={card.suffix || ''}
                  icon={card.icon}
                  color={card.color}
                  onClick={() => {}}
                />
              </motion.div>
            ))}
          </div>

          {/* Rejection Category KPIs - Detailed List */}
          <h2 className={`text-xl font-semibold mb-6 mt-8 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Rejection Analysis</h2>
          <div className="grid grid-cols-5 gap-4 mb-8">
            {rejectionCategories.map((cat, index) => {
              const items = reportData.rejections[cat.key] || [];
              const total = items.reduce((acc, item) => acc + item.value, 0);
              const rejectionRate = totalProcessed > 0 ? ((total / totalProcessed) * 100).toFixed(2) : 0;
              
              return (
                <motion.div
                  key={cat.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + (index * 0.1) }}
                >
                                <Card className={`h-full flex flex-col border ${darkMode ? 'bg-black border-white/20' : 'bg-white'}`}>
                                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className={`text-sm font-bold uppercase ${darkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                                      {cat.title} <span className="ml-3">({rejectionRate}%)</span>
                                    </CardTitle>
                                    <cat.icon className="h-4 w-4" style={{ color: cat.color }} />
                                  </CardHeader>
                                  <CardContent className="flex-1 flex flex-col">
                                    <div className="flex items-baseline gap-2 mb-4">
                                      <div className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {total}
                                      </div>
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
        </>
      )}
      
    </div>
  );
};

export default Report;