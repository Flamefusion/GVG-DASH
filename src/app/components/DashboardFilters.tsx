
import React from 'react';
import { Calendar as CalendarIcon, Filter, Moon, Sun, Search } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Calendar } from '@/app/components/ui/calendar';
import { format } from 'date-fns';

export const DashboardFilters: React.FC = () => {
  const { filters, setFilters, darkMode, toggleDarkMode, skus, sizes, applyFilters } = useDashboard();

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
              className={`w-40 justify-start text-left font-normal ${!filters.dateRange.from && "text-muted-foreground"} ${darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange.from ? format(filters.dateRange.from, "MM/dd/yyyy") : <span>From Date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filters.dateRange.from}
              onSelect={(date) => setFilters({ ...filters, dateRange: { ...filters.dateRange, from: date } })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <span className={darkMode ? 'text-white' : 'text-gray-700'}>to</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={`w-40 justify-start text-left font-normal ${!filters.dateRange.to && "text-muted-foreground"} ${darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange.to ? format(filters.dateRange.to, "MM/dd/yyyy") : <span>To Date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filters.dateRange.to}
              onSelect={(date) => setFilters({ ...filters, dateRange: { ...filters.dateRange, to: date } })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <Select
        value={filters.size}
        onValueChange={(value) => setFilters({ ...filters, size: value })}
      >
        <SelectTrigger className={`w-40 ${darkMode ? 'dark:bg-gray-700 dark:text-white border-gray-600' : ''}`}>
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent className={darkMode ? 'dark:bg-gray-700 dark:text-white' : ''}>
          {sizes.map(s => <SelectItem key={s} value={s} className={darkMode ? 'dark:hover:bg-gray-600 dark:focus:bg-gray-600' : ''}>{s === 'all' ? 'All Sizes' : s}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select
        value={filters.sku}
        onValueChange={(value) => setFilters({ ...filters, sku: value })}
      >
        <SelectTrigger className={`w-40 ${darkMode ? 'dark:bg-gray-700 dark:text-white border-gray-600' : ''}`}>
          <SelectValue placeholder="SKU" />
        </SelectTrigger>
        <SelectContent className={darkMode ? 'dark:bg-gray-700 dark:text-white' : ''}>
          {skus.map(s => <SelectItem key={s} value={s} className={darkMode ? 'dark:hover:bg-gray-600 dark:focus:bg-gray-600' : ''}>{s === 'all' ? 'All SKUs' : s}</SelectItem>)}
        </SelectContent>
      </Select>
      
      <Button onClick={applyFilters} className="flex items-center gap-2">
        <Search size={16} />
        Apply Filters
      </Button>

      <div className="ml-auto">
        <Button
          onClick={toggleDarkMode}
          variant="outline"
          size="icon"
          className="rounded-full"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </Button>
      </div>
    </div>
  );
};

