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
import { kpiData, DataRow } from '@/app/utils/mockData';
import { useDashboard } from '@/app/contexts/DashboardContext';

export const Home: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; data: DataRow[] }>({
    title: '',
    data: [],
  });
  const { darkMode } = useDashboard();

  const handleKPIClick = (title: string, data: DataRow[]) => {
    setModalData({ title, data });
    setModalOpen(true);
  };

  const kpiCards = [
    {
      title: 'TOTAL INWARD',
      value: kpiData.totalInward.value,
      change: kpiData.totalInward.change,
      icon: Package,
      color: '#3b82f6',
      data: kpiData.totalInward.data,
    },
    {
      title: 'QC ACCEPTED',
      value: kpiData.qcAccepted.value,
      change: kpiData.qcAccepted.change,
      icon: CheckCircle,
      color: '#10b981',
      data: kpiData.qcAccepted.data,
    },
    {
      title: 'TESTING ACCEPTED',
      value: kpiData.testingAccepted.value,
      change: kpiData.testingAccepted.change,
      icon: FlaskConical,
      color: '#8b5cf6',
      data: kpiData.testingAccepted.data,
    },
    {
      title: 'TOTAL REJECTED',
      value: kpiData.totalRejected.value,
      change: kpiData.totalRejected.change,
      icon: XCircle,
      color: '#ef4444',
      data: kpiData.totalRejected.data,
    },
    {
      title: 'MOVED TO INVENTORY',
      value: kpiData.movedToInventory.value,
      change: kpiData.movedToInventory.change,
      icon: Archive,
      color: '#f59e0b',
      data: kpiData.movedToInventory.data,
    },
    {
      title: 'WORK IN PROGRESS',
      value: kpiData.workInProgress.value,
      change: kpiData.workInProgress.change,
      icon: Clock,
      color: '#06b6d4',
      data: kpiData.workInProgress.data,
    },
  ];

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
              onClick={() => handleKPIClick(card.title, card.data)}
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

      <DataTableModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalData.title}
        data={modalData.data}
      />
    </div>
  );
};