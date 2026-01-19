
import React from 'react';
import { motion } from 'motion/react';
import {
  Package,
  CheckCircle,
  XCircle,
  TrendingUp,
  Download,
} from 'lucide-react';
import { KPICard } from '@/app/components/KPICard';
import { ReportFilters } from '@/app/components/ReportFilters';
import { RejectionReasons } from '@/app/components/RejectionReasons';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { reportKpis } from '@/app/mockData';
import { Button } from '@/app/components/ui/button';

const Report: React.FC = () => {
  const { darkMode } = useDashboard();
  const reportData = reportKpis.daily; // Default to daily for now

  const yieldValue = (reportData.totalAccepted / reportData.totalReceived) * 100;

  const kpiCards = [
    {
      title: 'TOTAL RECEIVED',
      value: reportData.totalReceived,
      change: '',
      icon: Package,
      color: '#3b82f6',
    },
    {
      title: 'TOTAL ACCEPTED',
      value: reportData.totalAccepted,
      change: '',
      icon: CheckCircle,
      color: '#10b981',
    },
    {
      title: 'TOTAL REJECTED',
      value: reportData.totalRejected,
      change: '',
      icon: XCircle,
      color: '#ef4444',
    },
    {
      title: 'YIELD',
      value: yieldValue,
      change: '%',
      icon: TrendingUp,
      color: '#8b5cf6',
    },
  ];

  return (
    <div
      className={`min-h-screen p-8 transition-colors ${
        darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Reports
        </h1>
        <Button onClick={() => { /* CSV export logic */ }} className="flex items-center gap-2">
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      <ReportFilters />

      <div className="grid grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <KPICard
              title={card.title}
              value={card.title === 'YIELD' ? parseFloat(card.value.toFixed(2)) : card.value}
              change={card.change}
              icon={card.icon}
              color={card.color}
              onClick={() => {}}
            />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <RejectionReasons />
      </motion.div>
    </div>
  );
};

export default Report;
