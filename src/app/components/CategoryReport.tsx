import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Layers,
  Disc,
  Activity,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Trash2,
  Gem,
  Download
} from 'lucide-react';
import { KPICard } from '@/app/components/KPICard';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { format } from 'date-fns';

export const CategoryReport: React.FC = () => {
  const { categoryReportData, darkMode, reportFilters } = useDashboard();
  const [selectedOutcome, setSelectedOutcome] = useState<string>("TOTAL REJECTION");

  if (!categoryReportData) return <div className="text-center py-10">No data available</div>;

  const totalInward = categoryReportData.kpis["total_inward"] || 0;

  const topKpis = [
    { 
      title: 'TOTAL REJECTION', 
      key: 'TOTAL REJECTION', 
      icon: AlertCircle, 
      color: '#ef4444', // Red
      percentage: totalInward > 0 ? ((categoryReportData.kpis['TOTAL REJECTION'] || 0) / totalInward) * 100 : 0
    },
    { 
      title: 'RT CONVERSION', 
      key: 'RT CONVERSION', 
      icon: RefreshCw, 
      color: '#f59e0b', // Yellow/Amber
      percentage: totalInward > 0 ? ((categoryReportData.kpis['RT CONVERSION'] || 0) / totalInward) * 100 : 0
    },
    { 
      title: 'WABI SABI', 
      key: 'WABI SABI', 
      icon: Gem, 
      color: '#fb923c', // Orange (Tailwind orange-400 equivalent for a vibrant look)
      percentage: totalInward > 0 ? ((categoryReportData.kpis['WABI SABI'] || 0) / totalInward) * 100 : 0
    },
    { 
      title: 'SCRAP', 
      key: 'SCRAP', 
      icon: Trash2, 
      color: '#ef4444', // Red
      percentage: totalInward > 0 ? ((categoryReportData.kpis['SCRAP'] || 0) / totalInward) * 100 : 0
    },
  ];

  const breakdownCategories = [
    { key: 'ASSEMBLY', title: 'ASSEMBLY', icon: Layers, color: '#f59e0b' },
    { key: 'CASTING', title: 'CASTING', icon: Disc, color: '#ec4899' },
    { key: 'FUNCTIONAL', title: 'FUNCTIONAL', icon: Activity, color: '#ef4444' },
    { key: 'SHELL', title: 'SHELL', icon: AlertTriangle, color: '#6366f1' },
    { key: 'POLISHING', title: 'POLISHING', icon: Sparkles, color: '#14b8a6' },
  ];

  const selectedData = categoryReportData.breakdown[selectedOutcome] || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Outcome KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {topKpis.map((kpi) => (
          <motion.div
            key={kpi.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedOutcome(kpi.key)}
            className={`cursor-pointer transition-all duration-300 ${selectedOutcome === kpi.key ? 'ring-4 ring-offset-2 ring-blue-500 rounded-2xl' : ''}`}
          >
            <KPICard
              title={kpi.title}
              value={categoryReportData.kpis[kpi.key] || 0}
              icon={kpi.icon}
              color={kpi.color}
              onClick={() => {}}
              percentage={kpi.percentage}
              percentageStyle="side"
            />
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <div className={`mt-2 inline-block px-4 py-1 rounded-full text-sm font-semibold ${darkMode ? 'bg-blue-900/30 text-blue-400 border border-blue-800' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
          Currently viewing: <span className="uppercase">{selectedOutcome}</span>
        </div>
      </div>

      {/* Breakdown Categories */}
      <div className="grid grid-cols-5 gap-4">
        {breakdownCategories.map((cat, index) => {
          const data = selectedData[cat.key] || { total: 0, rejections: [] };
          const items = data.rejections;
          const total = data.total;
          const outcomeTotal = categoryReportData.kpis[selectedOutcome] || 1;
          const percentage = ((total / outcomeTotal) * 100).toFixed(2);

          return (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`h-full flex flex-col border ${darkMode ? 'bg-black border-white/20' : 'bg-white'}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={`text-sm font-bold uppercase ${darkMode ? 'text-gray-200' : 'text-gray-600'}`}>
                    {cat.title} <span className="ml-3">({percentage}%)</span>
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
                    {items.map((item, idx) => {
                      const itemPercentage = (item.value / outcomeTotal) * 100;
                      const isItemWarning = itemPercentage > 10;

                      return (
                        <div key={idx} className="relative">
                          {isItemWarning ? (
                            <motion.div
                              animate={{ 
                                outlineColor: ["rgba(239, 68, 68, 1)", "rgba(239, 68, 68, 0)", "rgba(239, 68, 68, 1)"],
                                backgroundColor: ["rgba(239, 68, 68, 0.15)", "rgba(239, 68, 68, 0.05)", "rgba(239, 68, 68, 0.15)"]
                              }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className="flex justify-between items-start text-sm outline-[2px] outline-solid rounded-md p-2 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                            >
                              <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                                <AlertCircle size={12} className="animate-pulse" />
                                {item.name}
                              </span>
                              <span className="text-red-700 dark:text-red-300 font-black ml-2">
                                {item.value} ({(itemPercentage).toFixed(1)}%)
                              </span>
                            </motion.div>
                          ) : (
                            <div className="flex justify-between items-start text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} font-medium`}>
                                {item.name}
                              </span>
                              <span className={`${darkMode ? 'text-gray-100' : 'text-gray-900'} font-bold ml-2`}>
                                {item.value}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <div className={`text-sm italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        No rejections recorded
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
