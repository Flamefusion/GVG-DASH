
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDashboard } from '@/app/contexts/DashboardContext';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import { LoginModal } from '@/app/components/LoginModal';
import { LogIn, LogOut, Search } from 'lucide-react';

export const Nav: React.FC = () => {
  const { darkMode } = useDashboard();
  const { isAuthenticated, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center gap-2 ${
      isActive
        ? `text-white ${darkMode ? 'bg-gray-700' : 'bg-blue-500'}`
        : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`
    }`;

  return (
    <>
      <nav className={`p-4 flex justify-between items-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="w-24"></div> {/* Spacer for centering */}
        
        <div className={`flex space-x-2 p-1 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
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
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className={`flex items-center gap-2 ${darkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
            >
              <LogOut size={16} />
              Logout
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLoginOpen(true)}
              className={`flex items-center gap-2 ${darkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'}`}
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
