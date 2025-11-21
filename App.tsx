
import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRole, AppView } from './types';
import Layout from './components/Layout';
import Login from './pages/Login';
import PassengerHome from './pages/PassengerHome';
import DriverHome from './pages/DriverHome';
import AdminHome from './pages/AdminHome';
import UserProfile from './pages/UserProfile';
import RideHistory from './pages/RideHistory';
import ScheduleRides from './pages/ScheduleRides';
import Register from './pages/Register';
import Wallet from './pages/Wallet';

const AppContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('HOME');

  // Special Route: Registration (No auth required)
  if (currentView === 'REGISTER') {
    return (
      <Register 
        onNavigateHome={() => setCurrentView('HOME')} 
        onNavigateLogin={() => setCurrentView('HOME')} // Takes back to default login state
      />
    );
  }

  // Default Login State (No auth)
  if (!isAuthenticated) {
    return <Login onNavigateRegister={() => setCurrentView('REGISTER')} />;
  }

  const renderContent = () => {
    if (currentView === 'PROFILE') return <UserProfile />;
    if (currentView === 'HISTORY') return <RideHistory />;
    if (currentView === 'SCHEDULE') return <ScheduleRides />;
    if (currentView === 'WALLET') return <Wallet />;
    if (currentView === 'SETTINGS') return <UserProfile />; // Placeholder, reusing profile for now

    switch (user?.role) {
      case UserRole.ADMIN:
        return <AdminHome />;
      case UserRole.DRIVER:
        return <DriverHome />;
      case UserRole.PASSENGER:
      default:
        return <PassengerHome />;
    }
  };

  return (
    <Layout onNavigate={setCurrentView}>
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;