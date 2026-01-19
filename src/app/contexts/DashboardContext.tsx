import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DashboardFilters {
  dateRange: { from: Date | null; to: Date | null };
  size: string;
  sku: string;
}

interface DashboardContextType {
  filters: DashboardFilters;
  setFilters: (filters: DashboardFilters) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: { from: null, to: null },
    size: 'all',
    sku: 'all',
  });

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <DashboardContext.Provider value={{ filters, setFilters, darkMode, toggleDarkMode }}>
      <div className={darkMode ? 'dark' : ''}>
        {children}
      </div>
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