import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { kpiData, vqcChartData, ftChartData } from '../utils/mockData'; // Commented out, now fetching from backend

export interface DashboardFilters {
  dateRange: { from: Date | null; to: Date | null };
  size: string;
  sku: string;
}

export interface KPI {
  total_inward: number;
  qc_accepted: number;
  testing_accepted: number;
  total_rejected: number;
  moved_to_inventory: number;
  work_in_progress: number;
}

export interface ChartData {
  sku: string;
  count: number;
}

interface DashboardContextType {
  filters: DashboardFilters;
  setFilters: (filters: DashboardFilters) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  kpis: KPI | null;
  vqcWipChart: ChartData[];
  ftWipChart: ChartData[];
  loading: boolean;
  error: string | null;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080';

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: { from: null, to: null },
    size: 'all',
    sku: 'all',
  });
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [vqcWipChart, setVqcWipChart] = useState<ChartData[]>([]);
  const [ftWipChart, setFtWipChart] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [kpiResponse, chartResponse] = await Promise.all([
          fetch(`${BACKEND_URL}/kpis`),
          fetch(`${BACKEND_URL}/charts`),
        ]);

        if (!kpiResponse.ok) {
          throw new Error(`HTTP error! status: ${kpiResponse.status} for KPIs`);
        }
        if (!chartResponse.ok) {
          throw new Error(`HTTP error! status: ${chartResponse.status} for Charts`);
        }

        const kpiData = await kpiResponse.json();
        const chartData = await chartResponse.json();

        setKpis(kpiData);
        setVqcWipChart(chartData.vqc_wip_sku_wise);
        setFtWipChart(chartData.ft_wip_sku_wise);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(`Failed to load data: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <DashboardContext.Provider
      value={{
        filters,
        setFilters,
        darkMode,
        toggleDarkMode,
        kpis,
        vqcWipChart,
        ftWipChart,
        loading,
        error,
      }}
    >
      <div className={darkMode ? 'dark' : ''}>{children}</div>
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
};