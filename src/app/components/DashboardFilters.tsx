
import React, { useState } from 'react';
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
  const { filters, setFilters, darkMode, skus, sizes, applyFilters, isFullScreen, toggleFullScreen } = useDashboard();
  const [sizeOpen, setSizeOpen] = useState(false);
  const [skuOpen, setSkuOpen] = useState(false);

  const toggleSize = (size: string) => {
    setFilters(prev => ({
      ...prev,
      selectedSizes: prev.selectedSizes.includes(size)
        ? prev.selectedSizes.filter(s => s !== size)
        : [...prev.selectedSizes, size]
    }));
  };

  const toggleSku = (sku: string) => {
    setFilters(prev => ({
      ...prev,
      selectedSkus: prev.selectedSkus.includes(sku)
        ? prev.selectedSkus.filter(s => s !== sku)
        : [...prev.selectedSkus, sku]
    }));
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
            className={`w-40 justify-start text-left font-normal ${!filters.dateRange.from && "text-muted-foreground"}`}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dateRange.from ? format(filters.dateRange.from, "dd/MM/yyyy") : <span>From Date</span>}
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
            className={`w-40 justify-start text-left font-normal ${!filters.dateRange.to && "text-muted-foreground"}`}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.dateRange.to ? format(filters.dateRange.to, "dd/MM/yyyy") : <span>To Date</span>}
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

      {/* Size Multi-Select */}
      <Popover open={sizeOpen} onOpenChange={setSizeOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={sizeOpen} className="w-40 justify-between">
            {filters.selectedSizes.length > 0 ? `${filters.selectedSizes.length} Sizes selected` : "Select Size"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search size..." />
            <CommandList>
              <CommandEmpty>No size found.</CommandEmpty>
              <CommandGroup>
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
          <Button variant="outline" role="combobox" aria-expanded={skuOpen} className="w-40 justify-between">
            {filters.selectedSkus.length > 0 ? `${filters.selectedSkus.length} SKUs selected` : "Select SKU"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search SKU..." />
            <CommandList>
              <CommandEmpty>No SKU found.</CommandEmpty>
              <CommandGroup>
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
        value={filters.stage}
        onValueChange={(value) => setFilters({ ...filters, stage: value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="VQC">VQC</SelectItem>
          <SelectItem value="FT">FT</SelectItem>
          <SelectItem value="CS">CS</SelectItem>
          <SelectItem value="RT">RT</SelectItem>
          <SelectItem value="RT CS">RT CS</SelectItem>
          <SelectItem value="WABI SABI">WABI SABI</SelectItem>
        </SelectContent>
      </Select>
      
      <Button onClick={applyFilters} className="flex items-center gap-2">
        <Search size={16} />
        Apply Filters
      </Button>
    </div>
  );
};

