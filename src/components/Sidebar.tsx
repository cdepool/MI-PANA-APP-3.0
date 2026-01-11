import React from 'react';
import {
  Home,
  Wallet,
  History,
  User,
  Settings,
  LogOut,
  Car,
  FileCheck,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppView, UserRole } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  isDesktop?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, isDesktop = false }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { label: 'Inicio', icon: <Home size={20} />, path: '/' },
    { label: 'Billetera', icon: <Wallet size={20} />, path: '/wallet' },
    { label: 'Historial', icon: <History size={20} />, path: '/trips' },
    { label: 'Perfil', icon: <User size={20} />, path: '/profile' },
    { label: 'Agenda', icon: <FileCheck size={20} />, path: '/schedule' },
  ];

  const handleNavigation = (path: string) => {
    onNavigate(path);
    if (!isDesktop) onClose();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 bg-mipana-navy text-white">
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={user?.avatarUrl || 'https://via.placeholder.com/150'}
            alt="Profile"
            className="w-12 h-12 rounded-full border-2 border-mipana-orange object-cover"
          />
          <div className="overflow-hidden">
            <p className="font-bold truncate">{user?.name}</p>
            <p className="text-xs text-cyan-400 uppercase font-bold">{user?.role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleNavigation(item.path)}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 font-medium"
          >
            <span className="text-mipana-navy dark:text-cyan-400">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        {user?.role === UserRole.DRIVER && (
          <button
            onClick={() => handleNavigation('/profile')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 font-medium"
          >
            <span className="text-mipana-navy dark:text-cyan-400"><Car size={20} /></span>
            <span>Mis Vehículos</span>
          </button>
        )}

        {user?.role === UserRole.ADMIN && (
          <button
            onClick={() => handleNavigation('/admin')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 font-medium"
          >
            <span className="text-mipana-navy dark:text-cyan-400"><FileCheck size={20} /></span>
            <span>Aprobaciones</span>
          </button>
        )}

        <div className="h-px bg-gray-200 dark:bg-gray-700 my-4" />

        <button
          onClick={() => handleNavigation('/profile')}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 font-medium"
        >
          <span className="text-gray-400"><Settings size={20} /></span>
          <span>Configuración</span>
        </button>

        <button
          onClick={() => {
            logout();
            if (!isDesktop) onClose();
          }}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors font-bold mt-4"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
        <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
          MI PANA APP v3.0
        </p>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <SidebarContent />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <SidebarContent />
    </div>
  );
};

export default Sidebar;
