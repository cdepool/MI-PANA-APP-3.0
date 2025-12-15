
import React from 'react';
import { X, Home, User, Settings, LogOut, Car, History, CalendarClock, CreditCard, FileCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole, AppView } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
  isDesktop?: boolean; // New prop for desktop mode
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, isDesktop = false }) => {
  const { user, logout } = useAuth();

  const handleNavigation = (view: AppView) => {
    onNavigate(view);
    if (!isDesktop) {
      onClose(); // Only close on mobile
    }
  };

  const menuItems = [
    { icon: <Home size={20} />, label: 'Inicio', view: 'HOME' as AppView },
    { icon: <User size={20} />, label: 'Mi Perfil', view: 'PROFILE' as AppView },
    { icon: <CreditCard size={20} />, label: 'Billetera', view: 'WALLET' as AppView },
    { icon: <History size={20} />, label: 'Mis Viajes', view: 'HISTORY' as AppView },
    { icon: <CalendarClock size={20} />, label: 'Programados / Agenda', view: 'SCHEDULE' as AppView },
  ];

  // Desktop mode - no overlay, always visible
  if (isDesktop) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-800">
        {/* User Profile Section */}
        <div className="p-4 bg-gradient-to-b from-mipana-darkBlue to-[#011e45] text-white">
          <div className="flex items-center space-x-3">
            <img
              src={user?.avatarUrl}
              alt="Profile"
              className="w-12 h-12 rounded-full border-2 border-mipana-orange object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate text-sm">{user?.name}</p>
              <p className="text-xs text-mipana-mediumBlue uppercase">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleNavigation(item.view)}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 text-sm"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          {user?.role === UserRole.DRIVER && (
            <button
              onClick={() => handleNavigation('PROFILE')}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 text-sm"
            >
              <Car size={20} />
              <span>Mis Vehículos</span>
            </button>
          )}

          {user?.role === UserRole.ADMIN && (
            <button
              onClick={() => handleNavigation('APPROVALS' as AppView)}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 text-sm"
            >
              <FileCheck size={20} />
              <span>Aprobaciones</span>
            </button>
          )}

          <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

          <button
            onClick={() => handleNavigation('SETTINGS')}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 text-sm"
          >
            <Settings size={20} />
            <span>Configuración</span>
          </button>

          <button
            onClick={() => {
              logout();
            }}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors text-sm"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </nav>
      </div>
    );
  }

  // Mobile mode - with overlay and slide animation
  return (
    <>
      {/* Overlay - Mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel - Mobile */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-mipana-darkBlue text-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 flex justify-between items-center border-b border-white/10">
          <img
            src="/logo-blanco.png"
            alt="MI PANA APP"
            className="h-8 w-auto"
          />
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 bg-gradient-to-b from-mipana-darkBlue to-[#011e45]">
          <div className="flex items-center space-x-3 mb-2">
            <img
              src={user?.avatarUrl}
              alt="Profile"
              className="w-12 h-12 rounded-full border-2 border-mipana-orange object-cover"
            />
            <div>
              <p className="font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-mipana-mediumBlue uppercase">{user?.role}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleNavigation(item.view)}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-gray-100"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          {user?.role === UserRole.DRIVER && (
            <button
              onClick={() => handleNavigation('PROFILE')}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-gray-100"
            >
              <Car size={20} />
              <span>Mis Vehículos</span>
            </button>
          )}

          {user?.role === UserRole.ADMIN && (
            <button
              onClick={() => handleNavigation('APPROVALS' as AppView)}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-gray-100"
            >
              <FileCheck size={20} />
              <span>Aprobaciones</span>
            </button>
          )}

          <div className="h-px bg-white/10 my-4" />

          <button
            onClick={() => handleNavigation('SETTINGS')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-gray-100"
          >
            <Settings size={20} />
            <span>Configuración</span>
          </button>

          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors mt-4"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;