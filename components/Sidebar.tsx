
import React from 'react';
import { X, Home, User, Settings, LogOut, Car, History, CalendarClock, CreditCard, FileCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole, AppView } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate }) => {
  const { user, logout } = useAuth();

  const handleNavigation = (view: AppView) => {
    onNavigate(view);
    onClose();
  };

  const menuItems = [
    { icon: <Home size={20} />, label: 'Inicio', view: 'HOME' as AppView },
    { icon: <User size={20} />, label: 'Mi Perfil', view: 'PROFILE' as AppView },
    { icon: <CreditCard size={20} />, label: 'Billetera', view: 'WALLET' as AppView },
    { icon: <History size={20} />, label: 'Mis Viajes', view: 'HISTORY' as AppView },
    { icon: <CalendarClock size={20} />, label: 'Programados / Agenda', view: 'SCHEDULE' as AppView },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-mipana-darkBlue text-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 flex justify-between items-center border-b border-white/10">
          <img
            src="https://storage.googleapis.com/msgsndr/u0yeLpwH9qH0cMOrw2KP/media/69058570de82838b521f4610.png"
            alt="MI PANA APP"
            className="h-8 w-auto bg-white rounded px-2 py-1"
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