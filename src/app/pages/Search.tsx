import React, { useState, useEffect } from 'react';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { Button } from '@/app/components/ui/button';
import { Search as SearchIcon, Filter, ChevronLeft, ChevronRight, X, Check, ChevronsUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Calendar } from '@/app/components/ui/calendar';
import { format } from 'date-fns';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Checkbox } from '@/app/components/ui/checkbox';
import { cn } from '@/app/components/ui/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/app/components/ui/command";
import { motion } from 'motion/react';

const COMMON_STATUSES = [
  'ACCEPTED', 'REJECTED', 'SCRAP', 'WABI SABI', 'RT CONVERSION',
  'AESTHETIC SCRAP', 'FUNCTIONAL BUT REJECTED', 'SHELL RELATED',
  'FUNCTIONAL REJECTION', 'HOLD'
];

const COMMON_REASONS = [
  "BLACK GLUE", "ULTRAHUMAN TEXT SMUDGED", "WHITE PATCH ON BATTERY", "WHITE PATCH ON PCB", "WHITE PATCH ON BLACK TAPE", "WRONG RX COIL",
  "MICRO BUBBLES", "ALIGNMENT ISSUE", "DENT ON RESIN", "DUST INSIDE RESIN", "RESIN CURING ISSUE", "SHORT FILL OF RESIN", "SPM REJECTION",
  "TIGHT FIT FOR CHARGE", "LOOSE FITTING ON CHARGER", "RESIN SHRINKAGE", "WRONG MOULD", "GLOP TOP ISSUE", "100% ISSUE", "3 SENSOR ISSUE",
  "BATTERY ISSUE", "BLUETOOTH HEIGHT ISSUE", "CE TAPE ISSUE", "CHARGING CODE ISSUE", "COIL THICKNESS ISSUE/BATTERY THICKNESS",
  "COMPONENT HEIGHT ISSUE", "CURRENT ISSUE", "DISCONNECTING ISSUE", "HRS BUBBLE", "HRS COATING HEIGHT ISSUE", "HRS DOUBLE LIGHT ISSUE",
  "HRS HEIGHT ISSUE", "NO NOTIFICATION IN CDT", "NOT ADVERTISING (WINGLESS PCB)", "NOT CHARGING", "SENSOR ISSUE", "STC ISSUE", "R&D REJECTION",
  "IMPROPER RESIN FINISH", "RESIN DAMAGE", "RX COIL SCRATCH", "SCRATCHES ON RESIN", "SIDE SCRATCH", "SIDE SCRATCH (EMERY)", "SHELL COATING REMOVED",
  "UNEVEN POLISHING", "WHITE PATCH ON SHELL AFTER POLISHING", "SCRATCHES ON SHELL", "BLACK MARKS ON SHELL", "DENT ON SHELL", "DISCOLORATION",
  "IRREGULAR SHELL SHAPE", "SHELL COATING ISSUE", "WHITE MARKS ON SHELL"
].sort();

const Search: React.FC = () => {
  const { darkMode, searchFilters, setSearchFilters, searchResults, setSearchResults, lines } = useDashboard();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [vendorsList, setVendorsList] = useState<string[]>([]);
  const [skusList, setSkusList] = useState<string[]>([]);
  const [sizesList, setSizesList] = useState<string[]>([]);

  // Filter Popover States
  const [statusOpen, setStatusOpen] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [skuOpen, setSkuOpen] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:8080';

  useEffect(() => {
    // Fetch Vendors
    const fetchVendors = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/vendors`);
        if (response.ok) {
          const data = await response.json();
          setVendorsList(data);
        }
      } catch (error) {
        console.error("Failed to fetch vendors", error);
      }
    };
    fetchVendors();
  }, []);

  useEffect(() => {
    // Fetch SKUs and Sizes
    const fetchFilterOptions = async () => {
      try {
        // Always use default table (master_station_data)
        const [skusRes, sizesRes] = await Promise.all([
          fetch(`${BACKEND_URL}/skus`),
          fetch(`${BACKEND_URL}/sizes`)
        ]);

        if (skusRes.ok) setSkusList(await skusRes.json());
        if (sizesRes.ok) setSizesList(await sizesRes.json());
      } catch (error) {
        console.error("Failed to fetch filter options", error);
      }
    };
    fetchFilterOptions();
  }, []); // Run once, not dependent on stage anymore

  const buildSearchBody = (page = 1, download = false) => {
    return {
      page: download ? undefined : page,
      limit: download ? undefined : 100,
      download: download || undefined,
      serial_numbers: searchFilters.serialNumbers.trim() ? searchFilters.serialNumbers.replace(/\n/g, ',') : undefined,
      mo_numbers: searchFilters.moNumbers.trim() ? searchFilters.moNumbers.replace(/\n/g, ',') : undefined,
      stage: searchFilters.stage !== 'All' ? searchFilters.stage : 'All',
      vendor: searchFilters.vendor !== 'all' ? searchFilters.vendor : undefined,
      line: searchFilters.line !== 'All' ? searchFilters.line : undefined,
      sizes: searchFilters.selectedSizes.length > 0 ? searchFilters.selectedSizes : undefined,
      skus: searchFilters.selectedSkus.length > 0 ? searchFilters.selectedSkus : undefined,
      vqc_status: searchFilters.selectedStatuses.length > 0 ? searchFilters.selectedStatuses : undefined,
      rejection_reasons: searchFilters.selectedReasons.length > 0 ? searchFilters.selectedReasons : undefined,
      start_date: searchFilters.dateRange.from ? format(searchFilters.dateRange.from, 'yyyy-MM-dd') : undefined,
      end_date: searchFilters.dateRange.to ? format(searchFilters.dateRange.to, 'yyyy-MM-dd') : undefined,
    };
  };

  const handleSearch = async (page = 1) => {
    setLoading(true);

    try {
      const body = buildSearchBody(page);
      const response = await fetch(`${BACKEND_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setSearchResults({
        data: data.data,
        totalRecords: data.total_records,
        totalPages: data.total_pages,
        currentPage: page,
        hasSearched: true
      });
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults(prev => ({ ...prev, data: [] }));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const body = buildSearchBody(1, true);
      const response = await fetch(`${BACKEND_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Export failed');
      
      const result = await response.json();
      const allData = result.data;

      if (!allData || allData.length === 0) {
        alert("No data available to export.");
        return;
      }

      const headers = Object.keys(allData[0] || {});
      const csvContent = [
        headers.join(','),
        ...allData.map((row: any) =>
          headers.map(header => {
            const val = row[header];
            return val === null || val === undefined ? '' : JSON.stringify(val);
          }).join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const toggleStatus = (status: string) => {
    setSearchFilters(prev => ({
      ...prev,
      selectedStatuses: prev.selectedStatuses.includes(status) 
        ? prev.selectedStatuses.filter(s => s !== status) 
        : [...prev.selectedStatuses, status]
    }));
  };

  const toggleReason = (reason: string) => {
    setSearchFilters(prev => ({
      ...prev,
      selectedReasons: prev.selectedReasons.includes(reason) 
        ? prev.selectedReasons.filter(r => r !== reason) 
        : [...prev.selectedReasons, reason]
    }));
  };

  const toggleSize = (size: string) => {
    setSearchFilters(prev => ({
      ...prev,
      selectedSizes: prev.selectedSizes.includes(size) 
        ? prev.selectedSizes.filter(s => s !== size) 
        : [...prev.selectedSizes, size]
    }));
  };

  const toggleSku = (sku: string) => {
    setSearchFilters(prev => ({
      ...prev,
      selectedSkus: prev.selectedSkus.includes(sku) 
        ? prev.selectedSkus.filter(s => s !== sku) 
        : [...prev.selectedSkus, sku]
    }));
  };

  const toggleAllSizes = () => {
    const activeSizes = sizesList.filter(s => s && s.trim() !== '');
    if (searchFilters.selectedSizes.length === activeSizes.length) {
      setSearchFilters(prev => ({ ...prev, selectedSizes: [] }));
    } else {
      setSearchFilters(prev => ({ ...prev, selectedSizes: activeSizes }));
    }
  };

  const toggleAllSkus = () => {
    const activeSkus = skusList.filter(s => s && s.trim() !== '');
    if (searchFilters.selectedSkus.length === activeSkus.length) {
      setSearchFilters(prev => ({ ...prev, selectedSkus: [] }));
    } else {
      setSearchFilters(prev => ({ ...prev, selectedSkus: activeSkus }));
    }
  };

  const clearFilters = () => {
    setSearchFilters({
      serialNumbers: '',
      moNumbers: '',
      stage: 'All',
      vendor: 'all',
      selectedSizes: [],
      selectedSkus: [],
      selectedStatuses: [],
      selectedReasons: [],
      dateRange: { from: null, to: null },
      line: 'Production',
    });
    setSearchResults({
      data: [],
      totalRecords: 0,
      totalPages: 0,
      currentPage: 1,
      hasSearched: false
    });
  };

  return (
    <div className={`min-h-screen p-8 transition-colors ${darkMode ? 'bg-black' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <div>
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' }}>
              Advanced Search
            </h1>
            <p className={`mt-1 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Deep dive into production data with powerful filters.
            </p>
          </div>
          <Button variant="outline" onClick={clearFilters} className={`border-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'}`}>
            <X className="mr-2 h-4 w-4" /> Clear All Filters
          </Button>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`overflow-hidden backdrop-blur-sm border shadow-lg ${darkMode ? 'bg-black/80 border-white/20' : 'bg-white/80 border-gray-200'}`}>
            <CardHeader className="bg-gray-50/50 dark:bg-black border-b border-gray-100 dark:border-white/20">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-blue-100'}`}>
                   <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                Filter Criteria
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Serial Numbers */}
              <div className="space-y-2">
                <Label className="font-semibold">Serial Numbers (Comma separated)</Label>
                <Textarea 
                  placeholder="RNG001, RNG002..." 
                  value={searchFilters.serialNumbers}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, serialNumbers: e.target.value }))}
                  className="h-24 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* MO Numbers */}
              <div className="space-y-2">
                <Label className="font-semibold">MO Numbers (Comma separated)</Label>
                <Textarea 
                  placeholder="MO123, MO456..." 
                  value={searchFilters.moNumbers}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, moNumbers: e.target.value }))}
                  className="h-24 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Dropdowns & Pickers */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Line</Label>
                  <Select value={searchFilters.line} onValueChange={(val) => {
                    const options = val === 'WABI SABI' ? ['FT', 'CS'] : (val === 'All' ? ['All', 'VQC', 'FT', 'CS', 'RT', 'WABI SABI'] : ['VQC', 'FT', 'CS']);
                    const newStage = options.includes(searchFilters.stage) ? searchFilters.stage : options[0];
                    setSearchFilters(prev => ({ ...prev, line: val, stage: newStage }));
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Line" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Lines</SelectItem>
                      {lines.map(line => (
                        <SelectItem key={line} value={line}>{line}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">Stage</Label>
                  <Select value={searchFilters.stage} onValueChange={(val) => setSearchFilters(prev => ({ ...prev, stage: val }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {(searchFilters.line === 'WABI SABI' ? ['FT', 'CS'] : (searchFilters.line === 'All' ? ['All', 'VQC', 'FT', 'CS', 'RT', 'WABI SABI'] : ['VQC', 'FT', 'CS'])).map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">Vendor</Label>
                  <Select 
                    value={searchFilters.vendor} 
                    onValueChange={(val) => setSearchFilters(prev => ({ ...prev, vendor: val }))}
                    disabled={searchFilters.stage === 'WABI SABI'}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      {vendorsList.filter(v => v && v.trim() !== '').map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <Label className="font-semibold">Size ({searchFilters.selectedSizes.length})</Label>
                    <Popover open={sizeOpen} onOpenChange={setSizeOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={sizeOpen} className="w-full justify-between">
                          {searchFilters.selectedSizes.length > 0 ? `${searchFilters.selectedSizes.length} selected` : "Select Sizes"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder="Search size..." />
                          <CommandList>
                            <CommandEmpty>No size found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem onSelect={toggleAllSizes} className="flex items-center gap-2 cursor-pointer font-bold border-b pb-2 mb-1">
                                <Checkbox checked={searchFilters.selectedSizes.length === sizesList.filter(s => s && s.trim() !== '').length && sizesList.filter(s => s && s.trim() !== '').length > 0} />
                                Select All
                              </CommandItem>
                              <ScrollArea className="h-48">
                                {sizesList.filter(s => s && s.trim() !== '').map((size) => (
                                  <CommandItem key={size} onSelect={() => toggleSize(size)} className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox checked={searchFilters.selectedSizes.includes(size)} />
                                    {size}
                                  </CommandItem>
                                ))}
                              </ScrollArea>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label className="font-semibold">SKU ({searchFilters.selectedSkus.length})</Label>
                    <Popover open={skuOpen} onOpenChange={setSkuOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={skuOpen} className="w-full justify-between">
                          {searchFilters.selectedSkus.length > 0 ? `${searchFilters.selectedSkus.length} selected` : "Select SKUs"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Search SKU..." />
                          <CommandList>
                            <CommandEmpty>No SKU found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem onSelect={toggleAllSkus} className="flex items-center gap-2 cursor-pointer font-bold border-b pb-2 mb-1">
                                <Checkbox checked={searchFilters.selectedSkus.length === skusList.filter(s => s && s.trim() !== '').length && skusList.filter(s => s && s.trim() !== '').length > 0} />
                                Select All
                              </CommandItem>
                              <ScrollArea className="h-48">
                                {skusList.filter(sku => sku && sku.trim() !== '').map((sku) => (
                                  <CommandItem key={sku} onSelect={() => toggleSku(sku)} className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox checked={searchFilters.selectedSkus.includes(sku)} />
                                    {sku}
                                  </CommandItem>
                                ))}
                              </ScrollArea>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                 {/* Status Multi-Select */}
                 <div className="space-y-2">
                  <Label className="font-semibold">Ring Status ({searchFilters.selectedStatuses.length})</Label>
                  <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={statusOpen} className="w-full justify-between">
                        {searchFilters.selectedStatuses.length > 0 ? `${searchFilters.selectedStatuses.length} selected` : "Select Statuses"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search status..." />
                        <CommandList>
                          <CommandEmpty>No status found.</CommandEmpty>
                          <CommandGroup>
                            {COMMON_STATUSES.map((status) => (
                              <CommandItem key={status} onSelect={() => toggleStatus(status)} className="flex items-center gap-2 cursor-pointer">
                                <Checkbox checked={searchFilters.selectedStatuses.includes(status)} />
                                {status}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Reasons Multi-Select */}
                <div className="space-y-2">
                  <Label className="font-semibold">Rejection Reasons ({searchFilters.selectedReasons.length})</Label>
                   <Popover open={reasonOpen} onOpenChange={setReasonOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={reasonOpen} className="w-full justify-between">
                        {searchFilters.selectedReasons.length > 0 ? `${searchFilters.selectedReasons.length} selected` : "Select Reasons"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Search reason..." />
                        <CommandList>
                          <CommandEmpty>No reason found.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-72">
                              {COMMON_REASONS.map((reason) => (
                                <CommandItem key={reason} onSelect={() => toggleReason(reason)} className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox checked={searchFilters.selectedReasons.includes(reason)} />
                                  {reason}
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs uppercase text-gray-500 font-bold tracking-wider">Date From</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!searchFilters.dateRange.from && "text-muted-foreground"}`}>
                            {searchFilters.dateRange.from ? format(searchFilters.dateRange.from, "yyyy-MM-dd") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={searchFilters.dateRange.from || undefined} onSelect={(d) => setSearchFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, from: d || null } }))} initialFocus /></PopoverContent>
                      </Popover>
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs uppercase text-gray-500 font-bold tracking-wider">Date To</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant={"outline"} className={`w-full justify-start text-left font-normal ${!searchFilters.dateRange.to && "text-muted-foreground"}`}>
                            {searchFilters.dateRange.to ? format(searchFilters.dateRange.to, "yyyy-MM-dd") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={searchFilters.dateRange.to || undefined} onSelect={(d) => setSearchFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, to: d || null } }))} initialFocus /></PopoverContent>
                      </Popover>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons - New full width row at the bottom */}
              <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-end gap-2 border-t pt-6 border-gray-100 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    disabled={loading || exporting}
                    className={`px-4 shadow-sm transition-all ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'}`}
                  >
                    {exporting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"></div>
                        Exporting...
                      </>
                    ) : (
                      <><SearchIcon className="mr-2 h-4 w-4" /> Export CSV</>
                    )}
                  </Button>

                  <Button 
                    onClick={() => handleSearch(1)} 
                    disabled={loading || exporting}
                    className="px-8 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                    style={{ backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Searching...
                      </div>
                    ) : (
                      <><SearchIcon className="mr-2 h-4 w-4" /> Run Search</>
                    )}
                  </Button>
              </div>

            </CardContent>
          </Card>
        </motion.div>

        {/* Results Section */}
        {searchResults.hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={`overflow-hidden backdrop-blur-sm border shadow-lg ${darkMode ? 'bg-black/80 border-white/20' : 'bg-white/80 border-gray-200'}`}>
               <CardHeader className="bg-gray-50/50 dark:bg-black border-b border-gray-100 dark:border-white/20 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    Results <Badge variant="secondary" className="ml-2 text-sm">{searchResults.totalRecords} Records</Badge>
                  </CardTitle>
                  <div className="flex gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    Page {searchResults.currentPage} of {searchResults.totalPages}
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow className="border-border hover:bg-muted/50">
                          <TableHead className="w-[150px] font-bold">Serial Number</TableHead>
                          <TableHead className="font-bold">Vendor</TableHead>
                          <TableHead className="font-bold">Size</TableHead>
                          <TableHead className="font-bold">VQC Status</TableHead>
                          <TableHead className="font-bold">FT Status</TableHead>
                          <TableHead className="font-bold">CS Status</TableHead>
                          <TableHead className="font-bold">Reason (VQC/FT/CS)</TableHead>
                          <TableHead className="font-bold">MO Number</TableHead>
                          <TableHead className="font-bold">Inward Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={9} className="h-32 text-center">
                               <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                  Loading data...
                               </div>
                            </TableCell>
                          </TableRow>
                        ) : searchResults.data.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="h-32 text-center text-gray-500 italic">No matching records found.</TableCell>
                          </TableRow>
                        ) : (
                          searchResults.data.map((row, i) => (
                            <TableRow key={i} className="transition-colors border-border hover:bg-muted/50">
                              <TableCell className="font-medium font-mono text-blue-600 dark:text-blue-400">{row.serial_number}</TableCell>
                              <TableCell>{row.vendor}</TableCell>
                              <TableCell>{row.size}</TableCell>
                              <TableCell>
                                {row.vqc_status && <Badge variant="outline" className={row.vqc_status === 'ACCEPTED' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'}>{row.vqc_status}</Badge>}
                              </TableCell>
                              <TableCell>
                                 {row.ft_status && <Badge variant="outline" className={row.ft_status === 'ACCEPTED' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'}>{row.ft_status}</Badge>}
                              </TableCell>
                              <TableCell>
                                 {row.cs_status && <Badge variant="outline" className={row.cs_status === 'ACCEPTED' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'}>{row.cs_status}</Badge>}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate text-xs text-gray-600 dark:text-gray-400" title={`${row.vqc_reason || ''} ${row.ft_reason || ''} ${row.cs_reason || ''}`}>
                                {[row.vqc_reason, row.ft_reason, row.cs_reason].filter(Boolean).join(', ')}
                              </TableCell>
                              <TableCell className="font-mono text-xs">{row.ctpf_mo || row.air_mo || row.ctpf_po || '-'}</TableCell>
                              <TableCell className="whitespace-nowrap text-xs text-gray-500">{row.vqc_inward_date || row.ft_inward_date || row.cs_comp_date}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {searchResults.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 bg-muted/50 border-t border-border">
                      <div className="text-sm text-gray-500">
                        Showing {(searchResults.currentPage - 1) * 100 + 1} to {Math.min(searchResults.currentPage * 100, searchResults.totalRecords)} of {searchResults.totalRecords} entries
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSearch(searchResults.currentPage - 1)}
                          disabled={searchResults.currentPage <= 1 || loading}
                          className={darkMode ? 'border-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSearch(searchResults.currentPage + 1)}
                          disabled={searchResults.currentPage >= searchResults.totalPages || loading}
                          className={darkMode ? 'border-gray-600 hover:bg-gray-700' : 'hover:bg-gray-100'}
                        >
                          Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
               </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};
export default Search;