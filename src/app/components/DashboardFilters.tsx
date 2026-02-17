
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Filter, Search, ChevronsUpDown, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Calendar } from '@/app/components/ui/calendar';
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/app/components/ui/command";
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

export const DashboardFilters: React.FC = () => {
  const { filters, setFilters, darkMode, skus, sizes, lines, applyFilters, isFullScreen, toggleFullScreen } = useDashboard();
  const [sizeOpen, setSizeOpen] = useState(false);
  const [skuOpen, setSkuOpen] = useState(false);

  const toggleSize = (size: string) => {
    setFilters({
      ...filters,
      selectedSizes: filters.selectedSizes.includes(size)
        ? filters.selectedSizes.filter(s => s !== size)
        : [...filters.selectedSizes, size]
    });
  };

  const toggleSku = (sku: string) => {
    setFilters({
      ...filters,
      selectedSkus: filters.selectedSkus.includes(sku)
        ? filters.selectedSkus.filter(s => s !== sku)
        : [...filters.selectedSkus, sku]
    });
  };

  const toggleAllSizes = () => {
    const activeSizes = sizes.filter(s => s && s.trim() !== '');
    if (filters.selectedSizes.length === activeSizes.length) {
      setFilters({ ...filters, selectedSizes: [] });
    } else {
      setFilters({ ...filters, selectedSizes: activeSizes });
    }
  };

  const toggleAllSkus = () => {
    const activeSkus = skus.filter(s => s && s.trim() !== '');
    if (filters.selectedSkus.length === activeSkus.length) {
      setFilters({ ...filters, selectedSkus: [] });
    } else {
      setFilters({ ...filters, selectedSkus: activeSkus });
    }
  };

  const getStageOptions = (line: string) => {
    const upperLine = line.toUpperCase();
    if (upperLine === 'WABI SABI') {
      return ['FT', 'CS'];
    }
    if (upperLine === 'PRODUCTION' || upperLine === 'RT CONV' || upperLine === 'RT CONVERSION') {
      return ['VQC', 'FT', 'CS'];
    }
    return ['VQC', 'FT', 'CS', 'RT', 'RT CS', 'WABI SABI'];
  };

  const handleLineChange = (value: string) => {
    const options = getStageOptions(value);
    const newStage = options.includes(filters.stage) ? filters.stage : options[0];
    setFilters({ ...filters, line: value, stage: newStage });
  };

  return (
    <div className={`mb-4 flex flex-wrap items-center gap-2 rounded-2xl p-2 shadow-lg border ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent'}`}>
      <div className="flex items-center gap-2">
        <Filter className={darkMode ? 'text-white' : 'text-gray-700'} size={20} />
        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>Filters:</span>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={`w-28 h-8 text-xs justify-start text-left font-normal ${!filters.dateRange.from && "text-muted-foreground"}`}
          >
            <CalendarIcon className="mr-1 h-3 w-3" />
            {filters.dateRange.from ? format(filters.dateRange.from, "dd/MM/yyyy") : <span>From</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={filters.dateRange.from || undefined}
            onSelect={(date) => setFilters({ ...filters, dateRange: { ...filters.dateRange, from: date || null } })}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <span className={`text-xs ${darkMode ? 'text-white' : 'text-gray-700'}`}>to</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={`w-28 h-8 text-xs justify-start text-left font-normal ${!filters.dateRange.to && "text-muted-foreground"}`}
          >
            <CalendarIcon className="mr-1 h-3 w-3" />
            {filters.dateRange.to ? format(filters.dateRange.to, "dd/MM/yyyy") : <span>To</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={filters.dateRange.to || undefined}
            onSelect={(date) => setFilters({ ...filters, dateRange: { ...filters.dateRange, to: date || null } })}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Size Multi-Select */}
      <Popover open={sizeOpen} onOpenChange={setSizeOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={sizeOpen} className="w-24 h-8 text-xs justify-between">
            {filters.selectedSizes.length > 0 ? `${filters.selectedSizes.length} Sizes` : "Size"}
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search size..." />
            <CommandList>
              <CommandEmpty>No size found.</CommandEmpty>
              <CommandGroup>
                <CommandItem onSelect={toggleAllSizes} className="flex items-center gap-2 cursor-pointer font-bold border-b pb-2 mb-1">
                  <Checkbox checked={filters.selectedSizes.length === sizes.filter(s => s && s.trim() !== '').length && sizes.filter(s => s && s.trim() !== '').length > 0} />
                  Select All
                </CommandItem>
                <ScrollArea className="h-48">
                  {sizes.filter(s => s && s.trim() !== '').map((size) => (
                    <CommandItem key={size} onSelect={() => toggleSize(size)} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={filters.selectedSizes.includes(size)} />
                      {size}
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* SKU Multi-Select */}
      <Popover open={skuOpen} onOpenChange={setSkuOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={skuOpen} className="w-24 h-8 text-xs justify-between">
            {filters.selectedSkus.length > 0 ? `${filters.selectedSkus.length} SKUs` : "SKU"}
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search SKU..." />
            <CommandList>
              <CommandEmpty>No SKU found.</CommandEmpty>
              <CommandGroup>
                <CommandItem onSelect={toggleAllSkus} className="flex items-center gap-2 cursor-pointer font-bold border-b pb-2 mb-1">
                  <Checkbox checked={filters.selectedSkus.length === skus.filter(s => s && s.trim() !== '').length && skus.filter(s => s && s.trim() !== '').length > 0} />
                  Select All
                </CommandItem>
                <ScrollArea className="h-48">
                  {skus.filter(s => s && s.trim() !== '').map((sku) => (
                    <CommandItem key={sku} onSelect={() => toggleSku(sku)} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={filters.selectedSkus.includes(sku)} />
                      {sku}
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Select
        value={filters.line}
        onValueChange={handleLineChange}
      >
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue placeholder="Line" />
        </SelectTrigger>
        <SelectContent>
          {lines.map((line) => (
            <SelectItem key={line} value={line}>
              {line}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.stage}
        onValueChange={(value) => setFilters({ ...filters, stage: value })}
      >
        <SelectTrigger className="w-24 h-8 text-xs">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          {getStageOptions(filters.line).map((stage) => (
            <SelectItem key={stage} value={stage}>
              {stage}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button onClick={applyFilters} className="h-8 text-xs flex items-center gap-1">
        <Search size={14} />
        Apply
      </Button>
    </div>
  );
};

