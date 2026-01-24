import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Filter, Search } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Calendar } from '@/app/components/ui/calendar';
import { format } from 'date-fns';

interface ReportFiltersProps {
  onFilterChange: (filters: {
    dateRange: { from: Date | null; to: Date | null };
    vendor: string;
    stage: string;
  }) => void;
}

const reportStages = ['VQC', 'FT'];

export const ReportFilters: React.FC<ReportFiltersProps> = ({ onFilterChange }) => {
  const { darkMode } = useDashboard();
  const [dateRange, setDateRange] = React.useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [vendor, setVendor] = React.useState('all');
  const [stage, setStage] = React.useState('VQC');
  const [vendors, setVendors] = useState<string[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoadingVendors(true);
      try {
        const apiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080';
        const response = await fetch(`${apiUrl}/vendors`);
        if (response.ok) {
          const data = await response.json();
          setVendors(data);
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
      } finally {
        setLoadingVendors(false);
      }
    };
    fetchVendors();
  }, []);

  const handleApply = () => {
    onFilterChange({ dateRange, vendor, stage });
  };

  const isVendorDisabled = stage === 'FT';

  return (
    <div className={`mb-6 flex flex-wrap items-center gap-4 rounded-2xl p-4 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center gap-2">
        <Filter className={darkMode ? 'text-white' : 'text-gray-700'} size={20} />
        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>Filters:</span>
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={`w-40 justify-start text-left font-normal ${!dateRange.from && "text-muted-foreground"} ${darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? format(dateRange.from, "dd/MM/yyyy") : <span>From Date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateRange.from || undefined}
              onSelect={(date) => setDateRange({ ...dateRange, from: date || null })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <span className={darkMode ? 'text-white' : 'text-gray-700'}>to</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={`w-40 justify-start text-left font-normal ${!dateRange.to && "text-muted-foreground"} ${darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : <span>To Date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateRange.to || undefined}
              onSelect={(date) => setDateRange({ ...dateRange, to: date || null })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <Select value={stage} onValueChange={setStage}>
        <SelectTrigger className={`w-40 ${darkMode ? 'dark:bg-gray-700 dark:text-white border-gray-600' : ''}`}>
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent className={darkMode ? 'dark:bg-gray-700 dark:text-white' : ''}>
          {reportStages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={vendor} onValueChange={setVendor} disabled={isVendorDisabled}>
        <SelectTrigger className={`w-40 ${darkMode ? 'dark:bg-gray-700 dark:text-white border-gray-600' : ''}`}>
          <SelectValue placeholder="Vendor" />
        </SelectTrigger>
        <SelectContent className={darkMode ? 'dark:bg-gray-700 dark:text-white' : ''}>
          <SelectItem value="all">All Vendors</SelectItem>
          {vendors.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
        </SelectContent>
      </Select>
      
      <Button onClick={handleApply} className="flex items-center gap-2">
        <Search size={16} />
        Apply Filters
      </Button>
    </div>
  );
};