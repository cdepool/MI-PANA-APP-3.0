import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import PassengerHome from './pages/PassengerHome';
import DriverHome from './pages/DriverHome';
import ProfessionalAdminDashboard from './pages/ProfessionalAdminDashboard';
import Wallet from './pages/Wallet';
import RideHistory from './pages/RideHistory';
import UserProfile from './pages/UserProfile';
import ScheduleRides from './pages/ScheduleRides';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';

const PrivateRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <div className="flex items-center justify-center h-screen bg-mipana-darkBlue text-white">Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (role && user?.role !== role) return <Navigate to="/" />;

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/login" element={<Login onNavigateRegister={() => navigate('/register')} />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/register" element={<Register onNavigateHome={() => navigate('/')} onNavigateLogin={() => navigate('/login')} />} />


      <Route path="/" element={
        <PrivateRoute>
          {user?.role === 'ADMIN' ? <Navigate to="/admin" /> :
            user?.role === 'DRIVER' ? <Navigate to="/driver" /> :
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
