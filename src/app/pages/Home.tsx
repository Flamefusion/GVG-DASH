import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Package,
  CheckCircle,
  FlaskConical,
  XCircle,
  Archive,
  Clock,
  Sparkles,
} from 'lucide-react';
import { KPICard } from '@/app/components/KPICard';
import { ChartSection } from '@/app/components/ChartSection';
import { DataTableModal } from '@/app/components/DataTableModal';
import { DashboardFilters } from '@/app/components/DashboardFilters';
import { useDashboard } from '@/app/contexts/DashboardContext';

export const Home: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [selectedKpi, setSelectedKpi] = useState('');
  const { kpis, loading, error, darkMode } = useDashboard();

  const handleKPIClick = (title: string, kpiKey: string) => {
    setModalTitle(title);
    setSelectedKpi(kpiKey);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl text-gray-500 dark:text-gray-400">
        Loading dashboard data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl text-red-500">
        Error: {error}
      </div>
    );
  }

  const kpiCards = kpis ? [
    {
      title: 'TOTAL INWARD',
      kpiKey: 'total_inward',
      value: kpis.total_inward,
      change: '+12%',
      icon: Package,
      color: '#3b82f6',
    },
    {
      title: 'QC ACCEPTED',
      kpiKey: 'qc_accepted',
      value: kpis.qc_accepted,
      change: '+8%',
      icon: CheckCircle,
      color: '#10b981',
    },
    {
      title: 'TESTING ACCEPTED',
      kpiKey: 'testing_accepted',
      value: kpis.testing_accepted,
      change: '+5%',
      icon: FlaskConical,
      color: '#8b5cf6',
    },
    {
      title: 'TOTAL REJECTED',
      kpiKey: 'total_rejected',
      value: kpis.total_rejected,
      change: '-3%',
      icon: XCircle,
      color: '#ef4444',
    },
    {
      title: 'MOVED TO INVENTORY',
      kpiKey: 'moved_to_inventory',
      value: kpis.moved_to_inventory,
      change: '+10%',
      icon: Archive,
      color: '#f59e0b',
    },
    {
      title: 'WORK IN PROGRESS',
      kpiKey: 'work_in_progress',
      value: kpis.work_in_progress,
      change: '+2%',
      icon: Clock,
      color: '#06b6d4',
    },
  ] : [];

  return (
    <div
      className={`min-h-screen p-8 transition-colors ${
        darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-center gap-4 mb-2">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <Sparkles size={40} className="text-yellow-400" />
          </motion.div>
          <h1
            className="text-6xl font-extrabold text-center bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            }}
          >
            FQC DASHBOARD
          </h1>
          <motion.div
            animate={{
              rotate: [0, -10, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            <Sparkles size={40} className="text-pink-400" />
          </motion.div>
        </div>
        <p className={`text-center text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Quality Control Monitoring & Analytics
        </p>
      </motion.div>

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
              onClick={() => handleKPIClick(card.title, card.kpiKey)}
            />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <ChartSection />
      </motion.div>

      {modalOpen && (
        <DataTableModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalTitle}
          kpiKey={selectedKpi}
        />
      )}
    </div>
  );
};