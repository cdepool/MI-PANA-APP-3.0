import React, { useState } from 'react';
import { X } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { AppView } from '../types';
import ProfessionalHeader from '../src/components/ProfessionalHeader';

interface LayoutProps {
  children: React.ReactNode;
  onNavigate: (view: AppView) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onNavigate }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const handleNavigate = (view: AppView) => {
    onNavigate(view);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-mipana-lightGray dark:bg-[#011836] transition-colors duration-200 flex flex-col">
      <ProfessionalHeader />
      
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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-mipana-navy rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">MP</span>
              </div>
              <span className="font-bold text-lg tracking-tight text-mipana-navy dark:text-white">MI PANA APP</span>
            </div>
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
