import React, { useState, useEffect } from 'react';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Search as SearchIcon, Filter, ChevronLeft, ChevronRight, X, Check, ChevronsUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Calendar } from '@/app/components/ui/calendar';
import { format } from 'date-fns';
import { Checkbox } from '@/app/components/ui/checkbox';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { cn } from '@/app/components/ui/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/app/components/ui/command";


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
  const { darkMode } = useDashboard();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  // Filters
  const [serialNumbers, setSerialNumbers] = useState('');
  const [moNumbers, setMoNumbers] = useState('');
  const [stage, setStage] = useState('All');
  const [vendor, setVendor] = useState('all');
  const [vendorsList, setVendorsList] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });

  // Filter Popover States
  const [statusOpen, setStatusOpen] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);

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

  const handleSearch = async (page = 1) => {
    setLoading(true);
    setHasSearched(true);
    setCurrentPage(page);

    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '100');
      
      if (serialNumbers.trim()) params.append('serial_numbers', serialNumbers.replace(/\n/g, ','));
      if (moNumbers.trim()) params.append('mo_numbers', moNumbers.replace(/\n/g, ','));
      if (stage && stage !== 'All') params.append('stage', stage);
      if (vendor && vendor !== 'all') params.append('vendor', vendor);
      
      selectedStatuses.forEach(s => params.append('vqc_status', s));
      selectedReasons.forEach(r => params.append('rejection_reasons', r));

      if (dateRange.from) params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'));
      if (dateRange.to) params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'));

      const response = await fetch(`${BACKEND_URL}/search?${params.toString()}`);
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setResults(data.data);
      setTotalPages(data.total_pages);
      setTotalRecords(data.total_records);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleReason = (reason: string) => {
    setSelectedReasons(prev => 
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  const clearFilters = () => {
    setSerialNumbers('');
    setMoNumbers('');
    setStage('All');
    setVendor('all');
    setSelectedStatuses([]);
    setSelectedReasons([]);
    setDateRange({ from: null, to: null });
  };

  return (
    <div className={`min-h-screen p-6 transition-colors ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Advanced Search</h1>
          <Button variant="outline" onClick={clearFilters} className={darkMode ? 'border-gray-600 hover:bg-gray-800' : ''}>
            <X className="mr-2 h-4 w-4" /> Clear Filters
          </Button>
        </div>

        {/* Filters Section */}
        <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" /> Filter Criteria
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Serial Numbers */}
            <div className="space-y-2">
              <Label>Serial Numbers (Comma separated)</Label>
              <Textarea 
                placeholder="RNG001, RNG002..." 
                value={serialNumbers}
                onChange={(e) => setSerialNumbers(e.target.value)}
                className={`h-24 font-mono text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}
              />
            </div>

            {/* MO Numbers */}
            <div className="space-y-2">
              <Label>MO Numbers (Comma separated)</Label>
              <Textarea 
                placeholder="MO123, MO456..." 
                value={moNumbers}
                onChange={(e) => setMoNumbers(e.target.value)}
                className={`h-24 font-mono text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}
              />
            </div>

            {/* Dropdowns & Pickers */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                    <SelectValue placeholder="Select Stage" />
                  </SelectTrigger>
                  <SelectContent className={darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}>
                    {['All', 'VQC', 'FT', 'CS', 'RT'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select value={vendor} onValueChange={setVendor}>
                  <SelectTrigger className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                    <SelectValue placeholder="Select Vendor" />
                  </SelectTrigger>
                  <SelectContent className={darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}>
                    <SelectItem value="all">All Vendors</SelectItem>
                    {vendorsList.map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
               {/* Status Multi-Select */}
               <div className="space-y-2">
                <Label>VQC Status ({selectedStatuses.length})</Label>
                <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={statusOpen} className={`w-full justify-between ${darkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : ''}`}>
                      {selectedStatuses.length > 0 ? `${selectedStatuses.length} selected` : "Select Statuses"}
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
                            <CommandItem key={status} onSelect={() => toggleStatus(status)}>
                              <Check className={cn("mr-2 h-4 w-4", selectedStatuses.includes(status) ? "opacity-100" : "opacity-0")} />
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
                <Label>Rejection Reasons ({selectedReasons.length})</Label>
                 <Popover open={reasonOpen} onOpenChange={setReasonOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={reasonOpen} className={`w-full justify-between ${darkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : ''}`}>
                      {selectedReasons.length > 0 ? `${selectedReasons.length} selected` : "Select Reasons"}
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
                              <CommandItem key={reason} onSelect={() => toggleReason(reason)}>
                                <Check className={cn("mr-2 h-4 w-4", selectedReasons.includes(reason) ? "opacity-100" : "opacity-0")} />
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
            </div>
            
            {/* Date Range - Full Width Row */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 flex flex-wrap gap-4 items-end border-t pt-4 border-gray-200 dark:border-gray-700">
               <div className="flex items-center gap-2">
                 <Label>From:</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={`w-[140px] justify-start text-left font-normal ${!dateRange.from && "text-muted-foreground"} ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}>
                        {dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateRange.from || undefined} onSelect={(d) => setDateRange(prev => ({ ...prev, from: d || null }))} initialFocus /></PopoverContent>
                  </Popover>
               </div>
               
               <div className="flex items-center gap-2">
                 <Label>To:</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={`w-[140px] justify-start text-left font-normal ${!dateRange.to && "text-muted-foreground"} ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}>
                        {dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateRange.to || undefined} onSelect={(d) => setDateRange(prev => ({ ...prev, to: d || null }))} initialFocus /></PopoverContent>
                  </Popover>
               </div>

               <Button className="ml-auto w-32" onClick={() => handleSearch(1)} disabled={loading}>
                 {loading ? "Searching..." : <><SearchIcon className="mr-2 h-4 w-4" /> Search</>}
               </Button>
            </div>

          </CardContent>
        </Card>

        {/* Results Section */}
        {hasSearched && (
          <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
             <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Results ({totalRecords})</CardTitle>
                <div className="flex gap-2 text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
             </CardHeader>
             <CardContent>
                <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className={darkMode ? 'border-gray-700 hover:bg-gray-700/50' : ''}>
                        <TableHead className="w-[150px]">Serial Number</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>VQC Status</TableHead>
                        <TableHead>FT Status</TableHead>
                        <TableHead>CS Status</TableHead>
                        <TableHead>Reason (VQC/FT/CS)</TableHead>
                        <TableHead>MO Number (VQC)</TableHead>
                        <TableHead>Inward Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center">Loading...</TableCell>
                        </TableRow>
                      ) : results.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center">No results found.</TableCell>
                        </TableRow>
                      ) : (
                        results.map((row, i) => (
                          <TableRow key={i} className={darkMode ? 'border-gray-700 hover:bg-gray-700/50' : ''}>
                            <TableCell className="font-medium">{row.serial_number}</TableCell>
                            <TableCell>{row.vendor}</TableCell>
                            <TableCell>{row.size}</TableCell>
                            <TableCell>
                              {row.vqc_status && <Badge variant="outline" className={row.vqc_status === 'ACCEPTED' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>{row.vqc_status}</Badge>}
                            </TableCell>
                            <TableCell>
                               {row.ft_status && <Badge variant="outline" className={row.ft_status === 'ACCEPTED' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>{row.ft_status}</Badge>}
                            </TableCell>
                            <TableCell>
                               {row.cs_status && <Badge variant="outline" className={row.cs_status === 'ACCEPTED' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>{row.cs_status}</Badge>}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={`${row.vqc_reason || ''} ${row.ft_reason || ''} ${row.cs_reason || ''}`}>
                              {[row.vqc_reason, row.ft_reason, row.cs_reason].filter(Boolean).join(', ')}
                            </TableCell>
                            <TableCell>{row.ctpf_mo || row.air_mo || row.ctpf_po || '-'}</TableCell>
                            <TableCell>{row.vqc_inward_date || row.ft_inward_date || row.cs_comp_date}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSearch(currentPage - 1)}
                      disabled={currentPage <= 1 || loading}
                      className={darkMode ? 'border-gray-600' : ''}
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSearch(currentPage + 1)}
                      disabled={currentPage >= totalPages || loading}
                      className={darkMode ? 'border-gray-600' : ''}
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
             </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Search;
