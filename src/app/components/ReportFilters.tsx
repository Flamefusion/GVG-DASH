import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Filter, Search, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useDashboard, ReportFilters as IReportFilters } from '@/app/contexts/DashboardContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Calendar } from '@/app/components/ui/calendar';
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/app/components/ui/command";
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Checkbox } from '@/app/components/ui/checkbox';

interface ReportFiltersProps {
  onApply: () => void;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({ onApply }) => {
  const { darkMode, reportFilters, setReportFilters, skus, sizes, lines } = useDashboard();
  
  // Local state for filters to allow manual "Apply"
  const [localFilters, setLocalFilters] = useState<IReportFilters>(reportFilters);
  
  const [vendors, setVendors] = useState<string[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [skuOpen, setSkuOpen] = useState(false);

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

  const toggleSize = (size: string) => {
    setLocalFilters(prev => ({
      ...prev,
      selectedSizes: prev.selectedSizes.includes(size)
        ? prev.selectedSizes.filter(s => s !== size)
        : [...prev.selectedSizes, size]
    }));
  };

  const toggleSku = (sku: string) => {
    setLocalFilters(prev => ({
      ...prev,
      selectedSkus: prev.selectedSkus.includes(sku)
        ? prev.selectedSkus.filter(s => s !== sku)
        : [...prev.selectedSkus, sku]
    }));
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
    const newStage = options.includes(localFilters.stage) ? localFilters.stage : options[0];
    setLocalFilters({ ...localFilters, line: value, stage: newStage });
  };

  const handleApply = () => {
    setReportFilters(localFilters);
    onApply();
  };

  const isVendorDisabled = ['FT', 'RT', 'RT CS', 'WABI SABI'].includes(localFilters.stage);

  return (
    <div className={`mb-6 flex flex-wrap items-center gap-2 rounded-2xl p-2 shadow-lg border ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent'}`}>
      <div className="flex items-center gap-2">
        <Filter className={darkMode ? 'text-white' : 'text-gray-700'} size={20} />
        <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>Filters:</span>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={`w-28 h-8 text-xs justify-start text-left font-normal ${!localFilters.dateRange.from && "text-muted-foreground"}`}
          >
            <CalendarIcon className="mr-1 h-3 w-3" />
            {localFilters.dateRange.from ? format(localFilters.dateRange.from, "dd/MM/yyyy") : <span>From</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={localFilters.dateRange.from || undefined}
            onSelect={(date) => setLocalFilters({ ...localFilters, dateRange: { ...localFilters.dateRange, from: date || null } })}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <span className={`text-xs ${darkMode ? 'text-white' : 'text-gray-700'}`}>to</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={`w-28 h-8 text-xs justify-start text-left font-normal ${!localFilters.dateRange.to && "text-muted-foreground"}`}
          >
            <CalendarIcon className="mr-1 h-3 w-3" />
            {localFilters.dateRange.to ? format(localFilters.dateRange.to, "dd/MM/yyyy") : <span>To</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={localFilters.dateRange.to || undefined}
            onSelect={(date) => setLocalFilters({ ...localFilters, dateRange: { ...localFilters.dateRange, to: date || null } })}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Size Multi-Select */}
      <Popover open={sizeOpen} onOpenChange={setSizeOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={sizeOpen} className="w-24 h-8 text-xs justify-between">
            {localFilters.selectedSizes.length > 0 ? `${localFilters.selectedSizes.length} Sizes` : "Size"}
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
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
                      <Checkbox checked={localFilters.selectedSizes.includes(size)} />
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
            {localFilters.selectedSkus.length > 0 ? `${localFilters.selectedSkus.length} SKUs` : "SKU"}
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
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
                      <Checkbox checked={localFilters.selectedSkus.includes(sku)} />
                      {sku}
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Select value={localFilters.line} onValueChange={handleLineChange}>
        <SelectTrigger className="w-28 h-8 text-xs">
          <SelectValue placeholder="Line" />
        </SelectTrigger>
        <SelectContent>
          {lines.map(line => <SelectItem key={line} value={line}>{line}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={localFilters.stage} onValueChange={(stage) => setLocalFilters({ ...localFilters, stage })}>
        <SelectTrigger className="w-24 h-8 text-xs">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          {getStageOptions(localFilters.line).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={localFilters.vendor} onValueChange={(vendor) => setLocalFilters({ ...localFilters, vendor })} disabled={isVendorDisabled}>
        <SelectTrigger className="w-28 h-8 text-xs">
          <SelectValue placeholder="Vendor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Vendors</SelectItem>
          {vendors.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={localFilters.reportType} onValueChange={(val: 'Daily' | 'Rejection') => setLocalFilters({ ...localFilters, reportType: val })}>
        <SelectTrigger className="w-28 h-8 text-xs">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Daily">Daily Report</SelectItem>
          <SelectItem value="Rejection">Rejection Report</SelectItem>
        </SelectContent>
      </Select>

      <Button onClick={handleApply} className="h-8 text-xs flex items-center gap-1 ml-auto">
        <Search size={14} />
        Apply
      </Button>
    </div>
  );
};
