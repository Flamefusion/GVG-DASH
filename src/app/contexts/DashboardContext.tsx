import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface DashboardFilters {
  dateRange: { from: Date | null; to: Date | null };
  selectedSizes: string[];
  selectedSkus: string[];
  stage: string;
  line: string;
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

export interface AnalysisKPIs {
  total_rejected: number;
  de_tech_rejection: number;
  ihc_rejection: number;
  vqc_rejection: number;
  ft_rejection: number;
  cs_rejection: number;
}

export interface AnalysisChartData {
  name: string;
  value: number;
}

export interface AnalysisTrendData {
  day: string;
  rejected: number;
}

export interface RejectionDetail {
  name: string;
  value: number;
}

export interface ReportData {
  kpis: {
    output: number;
    accepted: number;
    rejected: number;
  };
  comparison_kpis?: {
    output: number;
    accepted: number;
    rejected: number;
  };
  rejections: {
    [category: string]: RejectionDetail[];
  };
}

export interface RejectionReportData {
  kpis: {
    "TOTAL REJECTIONS": number;
    "ASSEMBLY": number;
    "CASTING": number;
    "FUNCTIONAL": number;
    "POLISHING": number;
    "SHELL": number;
    [key: string]: number;
  };
  table_data: Array<{
    stage: string;
    rejection_type: string;
    total: number;
    [date: string]: number | string;
  }>;
  dates: string[];
}

export interface CategoryReportData {
  kpis: {
    "TOTAL REJECTION": number;
    "RT CONVERSION": number;
    "WABI SABI": number;
    "SCRAP": number;
    "total_inward": number;
  };
  breakdown: {
    [outcome: string]: {
      [category: string]: {
        total: number;
        rejections: Array<{ name: string; value: number }>;
      };
    };
  };
}

export interface ForecastData {
  kpis: {
    forecasted_yield: number;
    predicted_vqc_reject: number;
    predicted_ft_reject: number;
    predicted_cs_reject: number;
  };
  yieldTrend: Array<{ day: string; predicted_yield: number }>;
  topPredictedRejections: Array<{ name: string; value: number }>;
}

export interface AnalysisData {
  kpis: AnalysisKPIs;
  acceptedVsRejected: AnalysisChartData[];
  rejectionBreakdown: AnalysisChartData[];
  rejectionTrend: AnalysisTrendData[];
  topVqcRejections: AnalysisChartData[];
  topFtRejections: AnalysisChartData[];
  topCsRejections: AnalysisChartData[];
  deTechVendorRejections: AnalysisChartData[];
  ihcVendorRejections: AnalysisChartData[];
}

export interface ReportFilters {
  dateRange: { from: Date | null; to: Date | null };
  vendor: string;
  stage: string;
  reportType: 'Daily' | 'Rejection' | 'Category';
  selectedSizes: string[];
  selectedSkus: string[];
  line: string;
}

export interface SearchFilters {
  serialNumbers: string;
  moNumbers: string;
  stage: string;
  vendor: string;
  selectedSizes: string[];
  selectedSkus: string[];
  selectedStatuses: string[];
  selectedReasons: string[];
  dateRange: { from: Date | null; to: Date | null };
  line: string;
}

export interface SearchResults {
  data: any[];
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  hasSearched: boolean;
}

interface DashboardContextType {
  filters: DashboardFilters;
  setFilters: (filters: DashboardFilters) => void;
  reportFilters: ReportFilters;
  setReportFilters: (filters: ReportFilters) => void;
  searchFilters: SearchFilters;
  setSearchFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  searchResults: SearchResults;
  setSearchResults: React.Dispatch<React.SetStateAction<SearchResults>>;
  applyFilters: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  kpis: KPI | null;
  comparisonKpis: KPI | null;
  comparisonAnalysisKpis: any | null;
  vqcWipChart: ChartData[];
  ftWipChart: ChartData[];
  analysisData: AnalysisData | null;
  reportData: ReportData;
  setReportData: (data: ReportData) => void;
  rejectionReportData: RejectionReportData | null;
  setRejectionReportData: (data: RejectionReportData | null) => void;
  categoryReportData: CategoryReportData | null;
  setCategoryReportData: (data: CategoryReportData | null) => void;
  forecastData: ForecastData | null;
  setForecastData: (data: ForecastData | null) => void;
  skus: string[];
  sizes: string[];
  lines: string[];
  loading: boolean;
  error: string | null;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080';

const getMonthDateRange = () => {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  return { from, to };
};

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('dark_mode');
    return saved === 'true';
  });
  const [isFullScreen, setIsFullScreen] = useState(false);

  const getInitialFilters = (): DashboardFilters => {
    const defaultRange = getMonthDateRange();
    
    const startStr = searchParams.get('start_date');
    const endStr = searchParams.get('end_date');
    const skus = searchParams.getAll('sku');
    const sizes = searchParams.getAll('size');
    const line = searchParams.get('line');
    const stage = searchParams.get('stage');

    return {
      dateRange: {
        from: startStr ? new Date(startStr) : defaultRange.from,
        to: endStr ? new Date(endStr) : defaultRange.to,
      },
      selectedSizes: sizes.length > 0 ? sizes : [],
      selectedSkus: skus.length > 0 ? skus : [],
      stage: stage || 'VQC',
      line: line || 'PRODUCTION',
    };
  };

  const [filters, setFilters] = useState<DashboardFilters>(getInitialFilters);

  // Sync state to URL
  useEffect(() => {
    const newParams = new URLSearchParams();
    if (filters.dateRange.from) newParams.set('start_date', formatDate(filters.dateRange.from));
    if (filters.dateRange.to) newParams.set('end_date', formatDate(filters.dateRange.to));
    filters.selectedSkus.forEach(sku => newParams.append('sku', sku));
    filters.selectedSizes.forEach(size => newParams.append('size', size));
    newParams.set('line', filters.line);
    newParams.set('stage', filters.stage);
    
    setSearchParams(newParams, { replace: true });
  }, [filters, setSearchParams]);
  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    dateRange: getMonthDateRange(),
    vendor: 'all',
    stage: 'VQC',
    reportType: 'Daily',
    selectedSizes: [],
    selectedSkus: [],
    line: 'PRODUCTION',
  });
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    serialNumbers: '',
    moNumbers: '',
    stage: 'All',
    vendor: 'all',
    selectedSizes: [],
    selectedSkus: [],
    selectedStatuses: [],
    selectedReasons: [],
    dateRange: { from: null, to: null },
    line: 'PRODUCTION',
  });
  const [searchResults, setSearchResults] = useState<SearchResults>({
    data: [],
    totalRecords: 0,
    totalPages: 0,
    currentPage: 1,
    hasSearched: false,
  });

  const [kpis, setKpis] = useState<KPI | null>(null);
  const [comparisonKpis, setComparisonKpis] = useState<KPI | null>(null);
  const [comparisonAnalysisKpis, setComparisonAnalysisKpis] = useState<any | null>(null);
  const [vqcWipChart, setVqcWipChart] = useState<ChartData[]>([]);
  const [ftWipChart, setFtWipChart] = useState<ChartData[]>([]);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [reportData, setReportData] = useState<ReportData>({
    kpis: { output: 0, accepted: 0, rejected: 0 },
    rejections: {}
  });
  const [rejectionReportData, setRejectionReportData] = useState<RejectionReportData | null>(null);
  const [categoryReportData, setCategoryReportData] = useState<CategoryReportData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [skus, setSkus] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev);
  };
  
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const fetchData = useCallback(async (currentFilters: DashboardFilters) => {
    setLoading(true);
    setError(null);
    
    const params = new URLSearchParams();
    if (currentFilters.dateRange.from) {
      params.append('start_date', formatDate(currentFilters.dateRange.from));
    }
    if (currentFilters.dateRange.to) {
      params.append('end_date', formatDate(currentFilters.dateRange.to));
    }
    if (currentFilters.selectedSizes && currentFilters.selectedSizes.length > 0) {
      currentFilters.selectedSizes.forEach(s => params.append('size', s));
    }
    if (currentFilters.selectedSkus && currentFilters.selectedSkus.length > 0) {
      currentFilters.selectedSkus.forEach(s => params.append('sku', s));
    }
    if (currentFilters.line) {
      params.append('line', currentFilters.line);
    }
    if (currentFilters.stage) {
      params.append('stage', currentFilters.stage);
      let date_column = 'vqc_inward_date';
      if (currentFilters.stage === 'FT') {
        date_column = 'ft_inward_date';
      } else if (currentFilters.stage === 'CS' || currentFilters.stage === 'RT CS') {
        date_column = 'cs_comp_date';
      }
      // WABI SABI logic for date column is now handled backend side or default
      params.append('date_column', date_column);
    }
    const queryString = params.toString();

    try {
      const response = await fetch(`${BACKEND_URL}/home-summary?${queryString}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for Home Summary`);

      const data = await response.json();

      setKpis(data.kpis);
      setComparisonKpis(data.comparison_kpis);
      setComparisonAnalysisKpis(data.comparison_analysis_kpis);
      setVqcWipChart(data.charts.vqc_wip_sku_wise);
      setFtWipChart(data.charts.ft_wip_sku_wise);
      setAnalysisData(data.analysis);
    } catch (err) {
      console.error("Failed to fetch dashboard data from URL:", BACKEND_URL, err);
      setError(`Failed to load data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      // No need to pass table param anymore
      const [skusResponse, sizesResponse, linesResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/skus`),
        fetch(`${BACKEND_URL}/sizes`),
        fetch(`${BACKEND_URL}/lines`),
      ]);
      if (!skusResponse.ok) throw new Error('Failed to fetch SKUs');
      if (!sizesResponse.ok) throw new Error('Failed to fetch sizes');
      if (!linesResponse.ok) throw new Error('Failed to fetch lines');
      
      const skusData = await skusResponse.json();
      const sizesData = await sizesResponse.json();
      const linesData = await linesResponse.json();

      setSkus(skusData.filter((s: string) => s));
      setSizes(sizesData.filter((s: string) => s));
      setLines(linesData.filter((s: string) => s));
    } catch (err) {
      console.error("Failed to fetch filter options from URL:", BACKEND_URL, err);
      setError(`Failed to load filter options: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchData(filters);
  }, []);

  const applyFilters = () => {
    fetchData(filters);
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, [isFullScreen]);

  useEffect(() => {
    if (isFullScreen) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  }, [isFullScreen]);

  useEffect(() => {
    localStorage.setItem('dark_mode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <DashboardContext.Provider
      value={{
        filters,
        setFilters,
        reportFilters,
        setReportFilters,
        searchFilters,
        setSearchFilters,
        searchResults,
        setSearchResults,
        applyFilters,
        darkMode,
        toggleDarkMode,
        isFullScreen,
        toggleFullScreen,
        kpis,
        comparisonKpis,
        comparisonAnalysisKpis,
        vqcWipChart,
        ftWipChart,
        analysisData,
        reportData,
        setReportData,
        rejectionReportData,
        setRejectionReportData,
        categoryReportData,
        setCategoryReportData,
        forecastData,
        setForecastData,
        skus,
        sizes,
        lines,
        loading,
        error,
      }}
    >
      {children}
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