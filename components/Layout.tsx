import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, Bell, TrendingUp, X } from 'lucide-react';
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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

  const handleNavigate = (view: AppView) => {
    onNavigate(view);
    setIsMobileSidebarOpen(false); // Close mobile sidebar after navigation
  };

  return (
    <div className="min-h-screen bg-mipana-lightGray dark:bg-[#011836] transition-colors duration-200 flex flex-col lg:flex-row">
      {/* Desktop Sidebar - Always visible on large screens */}
      <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <img
            src="/logo-blanco.png"
            alt="MI PANA APP"
            className="h-12 w-auto object-contain mx-auto cursor-pointer"
            onClick={() => onNavigate('HOME')}
          />
        </div>
        <Sidebar
          isOpen={true}
          onClose={() => { }} // No-op on desktop
          onNavigate={handleNavigate}
          isDesktop={true}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`lg:hidden fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-800 z-50 transform transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <img
            src="/logo-blanco.png"
            alt="MI PANA APP"
            className="h-10 w-auto object-contain"
          />
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          onNavigate={handleNavigate}
          isDesktop={false}
        />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header / Navbar - Only on mobile/tablet */}
        <header className="lg:hidden sticky top-0 z-30 bg-mipana-darkBlue text-white shadow-md transition-colors duration-200">
          <div className="px-4 h-16 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors mr-3 focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label="Menu"
              >
                <Menu size={24} />
              </button>
              <div className="cursor-pointer select-none" onClick={() => onNavigate('HOME')}>
                <img
                  src="/logo-blanco.png"
                  alt="MI PANA APP"
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

        {/* Desktop Header - Only on large screens */}
        <header className="hidden lg:block sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TrendingUp size={18} className="text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tasa BCV:</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">Bs {bcvRate.toFixed(2)}</span>
            </div>

            <div className="flex items-center space-x-3">
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative transition-colors" aria-label="Notifications">
                <Bell size={20} className="text-gray-600 dark:text-gray-400" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-mipana-orange rounded-full"></span>
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={20} className="text-gray-400" /> : <Moon size={20} className="text-gray-600" />}
              </button>
            </div>
          </div>
        </header>

        {/* BCV Rate Bar - Mobile/Tablet only */}
        <div className="lg:hidden sticky top-16 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-1.5 px-4 flex justify-center items-center gap-2 text-xs shadow-sm transition-colors duration-200">
          <TrendingUp size={14} className="text-green-600 dark:text-green-400" />
          <span className="font-medium text-gray-500 dark:text-gray-400">Tasa BCV:</span>
          <span className="font-bold text-gray-900 dark:text-white font-mono">Bs {bcvRate.toFixed(2)}</span>
        </div>

        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto overflow-x-hidden">
          <div className="container-responsive max-w-7xl mx-auto p-4 md:p-6 lg:p-8 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;