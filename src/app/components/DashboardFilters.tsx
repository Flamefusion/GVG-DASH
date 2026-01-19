import React from 'react';
import { Calendar, Filter, Moon, Sun } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { useDashboard } from '@/app/contexts/DashboardContext';

export const DashboardFilters: React.FC = () => {
  const { filters, setFilters, darkMode, toggleDarkMode } = useDashboard();

  return (
    <div className={`mb-6 flex flex-wrap items-center gap-4 rounded-2xl p-4 shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center gap-2">
        <Filter className={darkMode ? 'text-white' : 'text-gray-700'} size={20} />
        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>Filters:</span>
      </div>

      <div className="flex items-center gap-2">
        <Calendar size={16} className={darkMode ? 'text-white' : 'text-gray-700'} />
        <Input
          type="date"
          value={filters.dateRange.from ? filters.dateRange.from.toISOString().split('T')[0] : ''}
          onChange={(e) => {
            setFilters({
              ...filters,
              dateRange: {
                ...filters.dateRange,
                from: e.target.value ? new Date(e.target.value) : null,
              },
            });
          }}
          className={`w-40 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}`}
          placeholder="From Date"
        />
        <span className={darkMode ? 'text-white' : 'text-gray-700'}>to</span>
        <Input
          type="date"
          value={filters.dateRange.to ? filters.dateRange.to.toISOString().split('T')[0] : ''}
          onChange={(e) => {
            setFilters({
              ...filters,
              dateRange: {
                ...filters.dateRange,
                to: e.target.value ? new Date(e.target.value) : null,
              },
            });
          }}
          className={`w-40 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}`}
          placeholder="To Date"
        />
      </div>

      <Select
        value={filters.size}
        onValueChange={(value) => setFilters({ ...filters, size: value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sizes</SelectItem>
          <SelectItem value="Small">Small</SelectItem>
          <SelectItem value="Medium">Medium</SelectItem>
          <SelectItem value="Large">Large</SelectItem>
          <SelectItem value="XL">XL</SelectItem>
          <SelectItem value="XXL">XXL</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.sku}
        onValueChange={(value) => setFilters({ ...filters, sku: value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="SKU" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All SKUs</SelectItem>
          <SelectItem value="SKU-A001">SKU-A001</SelectItem>
          <SelectItem value="SKU-B002">SKU-B002</SelectItem>
          <SelectItem value="SKU-C003">SKU-C003</SelectItem>
          <SelectItem value="SKU-D004">SKU-D004</SelectItem>
          <SelectItem value="SKU-E005">SKU-E005</SelectItem>
        </SelectContent>
      </Select>

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