import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import PassengerHome from '../pages/PassengerHome';
import DriverHome from '../pages/DriverHome';
import AdminHome from '../pages/AdminHome';
import ProfessionalAdminDashboard from '../pages/ProfessionalAdminDashboard';
import Wallet from '../pages/Wallet';
import { AuthProvider, useAuth } from './services/AuthContext';

const PrivateRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && profile?.role !== role) return <Navigate to="/" />;
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { profile } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <PrivateRoute>
          {profile?.role === 'admin' ? <Navigate to="/admin" /> : 
           profile?.role === 'driver' ? <Navigate to="/driver" /> : 
           <Navigate to="/passenger" />}
        </PrivateRoute>
      } />

      <Route path="/passenger" element={<PrivateRoute role="passenger"><PassengerHome /></PrivateRoute>} />
      <Route path="/driver" element={<PrivateRoute role="driver"><DriverHome /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute role="admin"><ProfessionalAdminDashboard /></PrivateRoute>} />
      <Route path="/admin-old" element={<PrivateRoute role="admin"><AdminHome /></PrivateRoute>} />
      <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
