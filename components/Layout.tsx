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

    <div className="min-h-screen bg-mipana-lightGray dark:bg-[#011836] transition-colors duration-200 flex flex-col">
      {/* Header / Navbar - Unified for all screens to match original design */}
      <header className="sticky top-0 z-30 bg-mipana-darkBlue text-white shadow-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
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
                alt="MI PANA"
                // Restore white background style for logo as seen in screenshots
                className="h-10 w-auto object-contain bg-white rounded px-2 py-0.5"
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



      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden">
        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar Drawer */}
        <aside className={`fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-800 z-50 transform transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <img
              src="/logo-blanco.png"
              alt="MI PANA APP"
              className="h-10 w-auto object-contain bg-mipana-darkBlue rounded px-2"
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

        <div className="max-w-7xl mx-auto p-4 md:p-6 w-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;