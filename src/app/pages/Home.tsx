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

// Define a placeholder DataRow interface if it's still needed for DataTableModal,
// otherwise remove it if the modal will be refactored to not expect this structure.
interface DataRow {
  id: number;
  date: string;
  sku: string;
  size: string;
  quantity: number;
  status: string;
  inspector: string;
  remarks: string;
}

export const Home: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ title: string; data: DataRow[] }>({
    title: '',
    data: [],
  });
  const { kpis, loading, error, darkMode } = useDashboard();

  const handleKPIClick = (title: string, data: DataRow[]) => {
    setModalData({ title, data });
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
      value: kpis.total_inward,
      change: '+12%', // Static for now, consider calculating dynamic change if data is available
      icon: Package,
      color: '#3b82f6',
      data: [], // No detailed data from backend for this, provide empty array
    },
    {
      title: 'QC ACCEPTED',
      value: kpis.qc_accepted,
      change: '+8%',
      icon: CheckCircle,
      color: '#10b981',
      data: [],
    },
    {
      title: 'TESTING ACCEPTED',
      value: kpis.testing_accepted,
      change: '+5%',
      icon: FlaskConical,
      color: '#8b5cf6',
      data: [],
    },
    {
      title: 'TOTAL REJECTED',
      value: kpis.total_rejected,
      change: '-3%',
      icon: XCircle,
      color: '#ef4444',
      data: [],
    },
    {
      title: 'MOVED TO INVENTORY',
      value: kpis.moved_to_inventory,
      change: '+10%',
      icon: Archive,
      color: '#f59e0b',
      data: [],
    },
    {
      title: 'WORK IN PROGRESS',
      value: kpis.work_in_progress,
      change: '+2%',
      icon: Clock,
      color: '#06b6d4',
      data: [],
    },
  ] : []; // If kpis is null, provide an empty array

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