import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, Bell, TrendingUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { AppView } from '../types';
import { getTariffs } from '../services/mockService';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (view: AppView) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [bcvRate, setBcvRate] = useState<number>(0);
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchRate = () => {
      const rate = getTariffs().currentBcvRate;
      setBcvRate(rate);
    };

    // Initial fetch
    fetchRate();

    // Check for rate updates every 10 seconds to ensure UI stays in sync with the background service
    const interval = setInterval(fetchRate, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-mipana-lightGray dark:bg-[#011836] transition-colors duration-200 flex flex-col">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-30 bg-mipana-darkBlue text-white shadow-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors mr-3 focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="Menu"
            >
              <Menu size={24} />
            </button>
            <div className="cursor-pointer select-none" onClick={() => onNavigate('HOME')}>
              <img
                src="/header-logo.png"
                alt="MI PANA"
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full hover:bg-white/10 relative transition-colors focus:outline-none focus:ring-2 focus:ring-white/20" aria-label="Notifications">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-mipana-orange rounded-full border border-mipana-darkBlue"></span>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Persistent BCV Rate Bar */}
      <div className="sticky top-16 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-1.5 px-4 flex justify-center items-center gap-2 text-xs shadow-sm transition-colors duration-200">
        <TrendingUp size={14} className="text-green-600 dark:text-green-400" />
        <span className="font-medium text-gray-500 dark:text-gray-400">Tasa BCV:</span>
        <span className="font-bold text-gray-900 dark:text-white font-mono">Bs {bcvRate.toFixed(2)}</span>
      </div>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNavigate={onNavigate}
        />

        <div className="max-w-7xl mx-auto p-4 md:p-6 w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;