
import React, { useState, Suspense } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRole, AppView } from './types';
import Layout from './components/Layout';
import { Toaster } from './components/ui/sonner';

// Lazy Load Pages for Performance (Code Splitting)
const Login = React.lazy(() => import('./pages/Login'));
const PassengerHome = React.lazy(() => import('./pages/PassengerHome'));
const DriverHome = React.lazy(() => import('./pages/DriverHome'));
const AdminHome = React.lazy(() => import('./pages/AdminHome'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));
const RideHistory = React.lazy(() => import('./pages/RideHistory'));
const ScheduleRides = React.lazy(() => import('./pages/ScheduleRides'));
const Register = React.lazy(() => import('./pages/Register'));
const Wallet = React.lazy(() => import('./pages/Wallet'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-mipana-lightGray dark:bg-gray-900">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-mipana-mediumBlue"></div>
  </div>
);

const AppContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('HOME');

  // Special Route: Registration (No auth required)
  if (currentView === 'REGISTER') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Register
          onNavigateHome={() => setCurrentView('HOME')}
          onNavigateLogin={() => setCurrentView('HOME')}
        />
      </Suspense>
    );
  }

  // Default Login State (No auth)
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Login onNavigateRegister={() => setCurrentView('REGISTER')} />
      </Suspense>
    );
  }

  const renderContent = () => {
    if (currentView === 'PROFILE') return <UserProfile />;
    if (currentView === 'HISTORY') return <RideHistory />;
    if (currentView === 'SCHEDULE') return <ScheduleRides />;
    if (currentView === 'WALLET') return <Wallet />;
    if (currentView === 'SETTINGS') return <UserProfile />;

    switch (user?.role) {
      case UserRole.ADMIN:
        return <AdminHome />;
      case UserRole.DRIVER:
        return <DriverHome />;
      case UserRole.PASSENGER:
      default:
        return <PassengerHome onNavigateWallet={() => setCurrentView('WALLET')} />;
    }
  };

  return (
    <Layout onNavigate={setCurrentView}>
      <Suspense fallback={<LoadingFallback />}>
        {renderContent()}
      </Suspense>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
