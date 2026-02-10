import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Filter, Search, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Calendar } from '@/app/components/ui/calendar';
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/app/components/ui/command";
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Checkbox } from '@/app/components/ui/checkbox';

interface ReportFiltersProps {}

const reportStages = ['VQC', 'FT'];

export const ReportFilters: React.FC<ReportFiltersProps> = () => {
  const { darkMode, reportFilters, setReportFilters, skus, sizes } = useDashboard();
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
    setReportFilters(prev => ({
      ...prev,
      selectedSizes: prev.selectedSizes.includes(size)
        ? prev.selectedSizes.filter(s => s !== size)
        : [...prev.selectedSizes, size]
    }));
  };

  const toggleSku = (sku: string) => {
    setReportFilters(prev => ({
      ...prev,
      selectedSkus: prev.selectedSkus.includes(sku)
        ? prev.selectedSkus.filter(s => s !== sku)
        : [...prev.selectedSkus, sku]
    }));
  };

  const isVendorDisabled = reportFilters.stage === 'FT';

  return (
    <div className={`mb-6 flex flex-wrap items-center gap-4 rounded-2xl p-4 shadow-lg border ${darkMode ? 'bg-black border-white/20' : 'bg-white border-transparent'}`}>
      <div className="flex items-center gap-2">
        <Filter className={darkMode ? 'text-white' : 'text-gray-700'} size={20} />
        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>Filters:</span>
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={`w-40 justify-start text-left font-normal ${!reportFilters.dateRange.from && "text-muted-foreground"}`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {reportFilters.dateRange.from ? format(reportFilters.dateRange.from, "dd/MM/yyyy") : <span>From Date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={reportFilters.dateRange.from || undefined}
              onSelect={(date) => setReportFilters({ ...reportFilters, dateRange: { ...reportFilters.dateRange, from: date || null } })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <span className={darkMode ? 'text-white' : 'text-gray-700'}>to</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={`w-40 justify-start text-left font-normal ${!reportFilters.dateRange.to && "text-muted-foreground"}`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {reportFilters.dateRange.to ? format(reportFilters.dateRange.to, "dd/MM/yyyy") : <span>To Date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={reportFilters.dateRange.to || undefined}
              onSelect={(date) => setReportFilters({ ...reportFilters, dateRange: { ...reportFilters.dateRange, to: date || null } })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Size Multi-Select */}
      <Popover open={sizeOpen} onOpenChange={setSizeOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={sizeOpen} className="w-40 justify-between">
            {reportFilters.selectedSizes.length > 0 ? `${reportFilters.selectedSizes.length} Sizes selected` : "Select Size"}
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
                      <Checkbox checked={reportFilters.selectedSizes.includes(size)} />
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
            {reportFilters.selectedSkus.length > 0 ? `${reportFilters.selectedSkus.length} SKUs selected` : "Select SKU"}
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
                      <Checkbox checked={reportFilters.selectedSkus.includes(sku)} />
                      {sku}
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Select value={reportFilters.stage} onValueChange={(stage) => setReportFilters({ ...reportFilters, stage })}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          {reportStages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={reportFilters.vendor} onValueChange={(vendor) => setReportFilters({ ...reportFilters, vendor })} disabled={isVendorDisabled}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Vendor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Vendors</SelectItem>
          {vendors.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={reportFilters.reportType} onValueChange={(val: 'Daily' | 'Rejection') => setReportFilters({ ...reportFilters, reportType: val })}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Report Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Daily">Daily Report</SelectItem>
          <SelectItem value="Rejection">Rejection Report</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};