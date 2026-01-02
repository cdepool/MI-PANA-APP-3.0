import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { AppView, UserRole } from './types';
import Layout from './components/Layout';
import PassengerHome from './pages/PassengerHome';
import DriverHome from './pages/DriverHome';
import ProfessionalAdminDashboard from './pages/ProfessionalAdminDashboard';
import UserManagement from './pages/UserManagement';
import Wallet from './pages/Wallet';
import Login from './pages/Login';

const App: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('HOME');

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'HOME':
        if (user?.role === UserRole.ADMIN) return <ProfessionalAdminDashboard />;
        if (user?.role === UserRole.DRIVER) return <DriverHome />;
        return <PassengerHome />;
      case 'WALLET':
        return <Wallet />;
      case 'APPROVALS':
        return <UserManagement />;
      default:
        return <div className="p-8 text-center font-bold text-mipana-navy">Vista en Desarrollo</div>;
    }
  };

  return (
    <Layout onNavigate={(view) => setCurrentView(view)}>
      {renderView()}
    </Layout>
  );
};

export default App;
