
import React from 'react';
import { motion } from 'motion/react';
import {
  Package,
  CheckCircle,
  FlaskConical,
  XCircle,
  Archive,
  Clock,
} from 'lucide-react';
import { KPICard } from '@/app/components/KPICard';
import { DashboardFilters } from '@/app/components/DashboardFilters';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { analysisKpis } from '@/app/mockData';
import { RejectionStatusCharts } from '@/app/components/RejectionStatusCharts';
import { RejectionTrendChart } from '@/app/components/RejectionTrendChart';
import { TopRejectionsCharts } from '@/app/components/TopRejectionsCharts';
import { VendorRejectionCharts } from '@/app/components/VendorRejectionCharts';

const Analysis: React.FC = () => {
  const { darkMode } = useDashboard();

  const kpiCards = [
    {
      title: 'TOTAL REJECTION',
      value: analysisKpis.totalRejection,
      change: '+5%',
      icon: XCircle,
      color: '#ef4444',
    },
    {
      title: '3DE TECH REJECTION',
      value: analysisKpis['3deTechRejection'],
      change: '+3%',
      icon: Package,
      color: '#f59e0b',
    },
    {
      title: 'IHC REJECTION',
      value: analysisKpis.ihcRejection,
      change: '-2%',
      icon: FlaskConical,
      color: '#8b5cf6',
    },
    {
      title: 'VQC REJECTION',
      value: analysisKpis.vqcRejection,
      change: '+7%',
      icon: CheckCircle,
      color: '#10b981',
    },
    {
      title: 'FT REJECTION',
      value: analysisKpis.ftRejection,
      change: '-1%',
      icon: Clock,
      color: '#06b6d4',
    },
    {
      title: 'CS REJECTION',
      value: analysisKpis.csRejection,
      change: '+4%',
      icon: Archive,
      color: '#3b82f6',
    },
  ];

  return (
    <div
      className={`min-h-screen p-8 transition-colors ${
        darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
      }`}
    >
      <DashboardFilters />

      <div className="grid grid-cols-6 gap-4 mb-8">
        {kpiCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <KPICard
              title={card.title}
              value={card.value}
              change={card.change}
              icon={card.icon}
              color={card.color}
              onClick={() => {}}
            />
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <RejectionStatusCharts />
      </motion.div>

      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <RejectionTrendChart />
      </motion.div>
      
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <TopRejectionsCharts />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <VendorRejectionCharts />
      </motion.div>
    </div>
  );
};

export default Analysis;
