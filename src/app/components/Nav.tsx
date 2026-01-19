
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDashboard } from '@/app/contexts/DashboardContext';

export const Nav: React.FC = () => {
  const { darkMode } = useDashboard();

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
      isActive
        ? `text-white ${darkMode ? 'bg-gray-700' : 'bg-blue-500'}`
        : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`
    }`;

  return (
    <nav className={`p-4 flex justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      <div className={`flex space-x-2 p-1 rounded-lg ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <NavLink to="/" className={getLinkClass}>
          Home
        </NavLink>
        <NavLink to="/analysis" className={getLinkClass}>
          Analysis
        </NavLink>
      </div>
    </nav>
  );
};
