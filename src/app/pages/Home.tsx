import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Package,
  CheckCircle,
  FlaskConical,
  XCircle,
  Archive,
  Clock,
  Info, // Added Info icon
} from 'lucide-react';
import { KPICard } from '@/app/components/KPICard';
import { ChartSection } from '@/app/components/ChartSection';
import { DataTableModal } from '@/app/components/DataTableModal';
import { DashboardFilters } from '@/app/components/DashboardFilters';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { Button } from '@/app/components/ui/button'; // Added Button import
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/app/components/ui/dialog'; // Added Dialog imports

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080';

export const Home: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [selectedKpi, setSelectedKpi] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const { kpis, loading, error, darkMode, isFullScreen, toggleFullScreen } = useDashboard();
  const fullScreenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLastUpdated = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/last-updated`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.last_updated_at) {
          const date = new Date(data.last_updated_at);
          const formattedDate = date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
          setLastUpdatedAt(formattedDate);
        }
      } catch (error) {
        console.error('Failed to fetch last updated time:', error);
      }
    };

    fetchLastUpdated();
  }, []);

  useEffect(() => {
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        if (isFullScreen) {
          toggleFullScreen();
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, [isFullScreen, toggleFullScreen]);

  useEffect(() => {
    if (fullScreenRef.current) {
      if (isFullScreen) {
        fullScreenRef.current.requestFullscreen();
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      }
    }
  }, [isFullScreen]);

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
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="absolute left-4 top-4">
                <Info className={darkMode ? 'text-white' : 'text-gray-700'} size={20} />
              </Button>
            </DialogTrigger>
            <DialogContent className={darkMode ? 'dark:bg-gray-800 dark:text-white' : ''}>
              <DialogHeader>
                <DialogTitle>How to Use This Dashboard</DialogTitle>
                <DialogDescription>
                  This dashboard provides an overview of Quality Control processes.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 text-left">
                <h3 className="text-lg font-semibold mb-2">1. Understanding Filters:</h3>
                <p className="mb-2">
                  The dashboard features a dynamic filtering system. The <strong>'Stage'</strong> filter
                  is crucial as it dictates which date field is used for filtering and which underlying
                  data table is queried.
                </p>
                <ul className="list-disc list-inside ml-4 mb-4">
                  <li>
                    <strong>VQC Stage (Default):</strong> Uses vqc inward date from <strong>step 7</strong>sheet for date filtering. Queries
                    the <code>master_station_data</code> table.
                  </li>
                  <li>
                    <strong>FT Stage:</strong> Uses ft inward date from <strong>step 8</strong>sheet for date filtering. Queries
                    the <code>master_station_data</code> table.
                  </li>
                  <li>
                    <strong>CS Stage:</strong> Uses cs complete date from <strong>Charging Station - 2</strong> sheet for date filtering. Queries
                    the <code>master_station_data</code> table.
                  </li>
                  <li>
                    <strong>RT Stage:</strong> Uses vqc inward date from <strong>RT CONVERSION 2.0</strong> sheet for date filtering. Queries
                    the <code>rt_conversion_data</code> table.
                  </li>
                  <li>
                    <strong>RT CS Stage:</strong> Uses <code>cs_comp_date</code> for date filtering. Queries
                    the <code>rt_conversion_data</code> table.
                  </li>
                </ul>
                <p className="mb-4">
                  The <strong>'Size'</strong> and <strong>'SKU'</strong> filters also adapt to the selected stage,
                  fetching their options from the corresponding data table.
                </p>

                <h3 className="text-lg font-semibold mb-2">2. Dashboard Use Scenarios:</h3>
                <ul className="list-disc list-inside ml-4">
                  <li>
                    <strong>Track WIP:</strong> Monitor Work In Progress across all stages of FQC (VQC, FT, CS, RT).
                  </li>
                  <li>
                    <strong>Download KPI Data:</strong> All KPI cards are interactive. Clicking on a KPI card
                    allows you to download the underlying data directly, with no row limitations.
                  </li>
                  <li>
                    <strong>Visualize Quality Data:</strong> The Analysis page provides comprehensive
                    visualizations of overall quality data.
                  </li>
                  <li>
                    <strong>Generate Reports:</strong> The Report page facilitates easy generation of daily,
                    weekly, and monthly reports.
                  </li>
                </ul>
              </div>
            </DialogContent>
          </Dialog>
          <h1
            className="text-6xl font-extrabold text-center bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            }}
          >
            FQC DASHBOARD
          </h1>
        </div>
        <p className={`text-center text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Quality Control Monitoring & Analytics
        </p>
        {lastUpdatedAt && (
            <p className={`text-center text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Last data sync: {lastUpdatedAt}
            </p>
        )}
      </motion.div>

      <DashboardFilters />

      <div ref={fullScreenRef} className={isFullScreen ? "bg-gray-900 p-8" : ""}>
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
      </div>

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