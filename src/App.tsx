import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Lazy load pages for performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const PassengerHome = lazy(() => import('./pages/PassengerHome'));
const DriverHome = lazy(() => import('./pages/DriverHome'));
const ProfessionalAdminDashboard = lazy(() => import('./pages/ProfessionalAdminDashboard'));
const Wallet = lazy(() => import('./pages/Wallet'));
const RideHistory = lazy(() => import('./pages/RideHistory'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const ScheduleRides = lazy(() => import('./pages/ScheduleRides'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));

import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';

const PrivateRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
  const { isAuthenticated, effectiveRole, isLoading } = useAuth();

  if (isLoading) return <div className="flex items-center justify-center h-screen bg-mipana-darkBlue text-white">Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role && effectiveRole !== role) return <Navigate to="/" />;

  return <>{children}</>;
};

const AppRoutes = () => {
  const { effectiveRole } = useAuth();
  const navigate = useNavigate();

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-mipana-darkBlue text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Cargando...</p>
        </div>
      </div>
    }>
      <Routes>
        <Route path="/login" element={<Login onNavigateRegister={() => navigate('/register')} />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/register" element={<Register onNavigateHome={() => navigate('/')} onNavigateLogin={() => navigate('/login')} />} />


        <Route path="/" element={
          <PrivateRoute>
            {effectiveRole === 'ADMIN' ? <Navigate to="/admin" /> :
              effectiveRole === 'DRIVER' ? <Navigate to="/driver" /> :
                <Navigate to="/passenger" />}
          </PrivateRoute>
        } />
        <Route path="/passenger" element={<PrivateRoute role="PASSENGER"><Layout onNavigate={navigate}><PassengerHome onNavigateWallet={() => navigate('/wallet')} /></Layout></PrivateRoute>} />
        <Route path="/driver" element={<PrivateRoute role="DRIVER"><Layout onNavigate={navigate}><DriverHome /></Layout></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute role="ADMIN"><Layout onNavigate={navigate}><ProfessionalAdminDashboard /></Layout></PrivateRoute>} />
        <Route path="/wallet" element={<PrivateRoute><Layout onNavigate={navigate}><Wallet /></Layout></PrivateRoute>} />
        <Route path="/trips" element={<PrivateRoute><Layout onNavigate={navigate}><RideHistory /></Layout></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Layout onNavigate={navigate}><UserProfile /></Layout></PrivateRoute>} />
        <Route path="/schedule" element={<PrivateRoute><Layout onNavigate={navigate}><ScheduleRides /></Layout></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster richColors closeButton position="top-center" />
      </Router>
    </AuthProvider>
  );
}

export default App;
