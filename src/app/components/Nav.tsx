
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import { LoginModal } from '@/app/components/LoginModal';
import { LogIn, LogOut, Search, Moon, Sun, Maximize, Minimize, Info } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/app/components/ui/dialog';

export const Nav: React.FC = () => {
  const { darkMode, toggleDarkMode, isFullScreen, toggleFullScreen } = useDashboard();
  const { isAuthenticated, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 border ${
      isActive
        ? `text-white border-transparent shadow-lg ${darkMode ? 'bg-indigo-600' : 'bg-blue-500'}`
        : `${darkMode ? 'text-gray-300 border-transparent dark:border-white/5 hover:bg-gray-800 hover:text-white' : 'text-gray-600 border-transparent hover:bg-gray-200'}`
    }`;

  return (
    <>
      <nav className={`p-4 flex justify-between items-center ${darkMode ? 'bg-black border-b border-white/10' : 'bg-gray-100'}`}>
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleDarkMode}
            variant="outline"
            size="icon"
            className="rounded-full h-9 w-9"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          <Button
            onClick={toggleFullScreen}
            variant="outline"
            size="icon"
            className="rounded-full h-9 w-9"
          >
            {isFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                <Info size={18} />
              </Button>
            </DialogTrigger>
            <DialogContent className={darkMode ? 'dark:bg-black dark:text-white border-white/20' : ''}>
              <DialogHeader>
                <DialogTitle>How to Use This Dashboard</DialogTitle>
                <DialogDescription>
                  This dashboard provides an overview of Quality Control processes.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 text-left">
                <h3 className="text-lg font-semibold mb-2">1. Understanding Filters:</h3>
                <p className="mb-2">
                  The dashboard features a dynamic filtering system. The <strong>'Stage'</strong> filter
                  is crucial as it dictates which date field is used for filtering and which underlying
                  data table is queried.
                </p>
                <ul className="list-disc list-inside ml-4 mb-4">
                  <li>
                    <strong>VQC Stage (Default):</strong> Uses vqc inward date from <strong>step 7</strong> sheet for date filtering.
                  </li>
                  <li>
                    <strong>FT Stage:</strong> Uses ft inward date from <strong>step 8</strong> sheet for date filtering.
                  </li>
                  <li>
                    <strong>CS Stage:</strong> Uses cs complete date from <strong>Charging Station - 2</strong> sheet for date filtering.
                  </li>
                  <li>
                    <strong>RT Stage:</strong> Uses vqc inward date from <strong>RT CONVERSION 2.0</strong> sheet for date filtering.
                  </li>
                  <li>
                    <strong>RT CS Stage:</strong> Uses <code>cs_comp_date</code> for date filtering.
                  </li>
                </ul>
                <h3 className="text-lg font-semibold mb-2">2. Dashboard Use Scenarios:</h3>
                <ul className="list-disc list-inside ml-4">
                  <li><strong>Track WIP:</strong> Monitor Work In Progress across all stages.</li>
                  <li><strong>Download KPI Data:</strong> Click any KPI card to download raw data.</li>
                  <li><strong>Visualize Quality Data:</strong> Use the Analysis page for trends.</li>
                  <li><strong>Generate Reports:</strong> Use the Report page for structured exports.</li>
                </ul>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className={`flex space-x-2 p-1 rounded-lg border ${darkMode ? 'bg-gray-900 border-white/10' : 'bg-white border-transparent'}`}>
          <NavLink to="/" className={getLinkClass}>
            Home
          </NavLink>
          <NavLink to="/analysis" className={getLinkClass}>
            Analysis
          </NavLink>
          <NavLink to="/report" className={getLinkClass}>
            Report
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/search" className={getLinkClass}>
              <Search size={16} />
              Search
            </NavLink>
          )}
        </div>

        <div className="w-24 flex justify-end">
          {isAuthenticated ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout}
              className={`flex items-center gap-2 ${darkMode ? 'text-white' : ''}`}
            >
              <LogOut size={16} />
              Logout
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setLoginOpen(true)}
              className={`flex items-center gap-2 ${darkMode ? 'text-white' : ''}`}
            >
              <LogIn size={16} />
              Login
            </Button>
          )}
        </div>
      </nav>

      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
};
