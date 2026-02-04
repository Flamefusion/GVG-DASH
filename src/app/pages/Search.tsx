import React, { useState } from 'react';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Search as SearchIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

const Search: React.FC = () => {
  const { darkMode } = useDashboard();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]); // Placeholder for results
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    // Placeholder logic - to be implemented with actual backend search endpoint
    setResults([]); 
  };

  return (
    <div className={`min-h-screen p-8 transition-colors ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className={`text-3xl font-bold text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Advanced Search
        </h1>
        
        <Card className={darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <SearchIcon className={`absolute left-3 top-3 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <Input
                  type="text"
                  placeholder="Search by Serial Number, Vendor, or Batch ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                />
              </div>
              <Button type="submit">
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {searched && (
          <div className="text-center py-10">
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No results found for "{searchQuery}"
            </p>
            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              (Backend search integration pending)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
