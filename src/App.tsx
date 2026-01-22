import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { isDriverDomain, isAdminDomain } from './utils/domain';

// Contexts
// Contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Components
import { SimpleErrorBoundary } from './components/SimpleErrorBoundary';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';

// Pages
const Login = lazy(() => import('./pages/Login'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const Register = lazy(() => import('./pages/Register'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const PassengerHome = lazy(() => import('./pages/PassengerHome'));
const DriverHome = lazy(() => import('./pages/DriverHome'));
const AdminHome = lazy(() => import('./pages/AdminHome'));
const Wallet = lazy(() => import('./pages/Wallet'));
const RideHistory = lazy(() => import('./pages/RideHistory'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const ScheduleRides = lazy(() => import('./pages/ScheduleRides'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const TeamManagement = lazy(() => import('./pages/admin/TeamManagement'));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const OperationsMonitor = lazy(() => import('./pages/admin/OperationsMonitor'));
const Reconciliation = lazy(() => import('./pages/admin/Reconciliation'));

const AppRoutes = () => {
  const { effectiveRole } = useAuth();
  const navigate = useNavigate();

  const isDriver = isDriverDomain();
  const isAdmin = isAdminDomain();

  return (
    <SimpleErrorBoundary>
      <Suspense fallback={<SplashScreen />}>
        <Routes>
          {/* Common Routes - Available on all domains */}
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* CONFIGURACIÓN CONDUCTORES (chofer.mipana.app) */}
          {isDriver && (
            <>
              <Route path="/login" element={<Login onNavigateRegister={() => navigate('/register')} />} />
              <Route path="/register" element={<Register onNavigateHome={() => navigate('/')} onNavigateLogin={() => navigate('/login')} />} />
              <Route path="/" element={
                <PrivateRoute role="DRIVER">
                  <Layout onNavigate={navigate}>
                    <DriverHome />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}

          {/* CONFIGURACIÓN ADMIN (admin.mipana.app) */}
          {isAdmin && (
            <>
              <Route path="/login" element={<AdminLogin />} />
              <Route path="/" element={
                <PrivateRoute role="ADMIN">
                  <Layout onNavigate={navigate}>
                    <AdminHome />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/team" element={
                <PrivateRoute role="ADMIN">
                  <Layout onNavigate={navigate}>
                    <TeamManagement />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/settings" element={
                <PrivateRoute role="ADMIN">
                  <Layout onNavigate={navigate}>
                    <SystemSettings />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/audit-logs" element={
                <PrivateRoute role="ADMIN">
                  <Layout onNavigate={navigate}>
                    <AuditLogs />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/operations" element={
                <PrivateRoute role="ADMIN">
                  <Layout onNavigate={navigate}>
                    <OperationsMonitor />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/reconciliation" element={
                <PrivateRoute role="ADMIN">
                  <Layout onNavigate={navigate}>
                    <Reconciliation />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/admin-login" element={<Navigate to="/login" />} />
              <Route path="/admin" element={<Navigate to="/" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}

          {/* CONFIGURACIÓN PASAJEROS / DEFAULT (v1.mipana.app) */}
          {!isDriver && !isAdmin && (
            <>
              <Route path="/login" element={<Login onNavigateRegister={() => navigate('/register')} />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/register" element={<Register onNavigateHome={() => navigate('/')} onNavigateLogin={() => navigate('/login')} />} />

              <Route path="/" element={
                <PrivateRoute>
                  {effectiveRole === 'ADMIN' ? <Navigate to="/admin" /> :
                    effectiveRole === 'DRIVER' ? <Navigate to="/driver" /> :
                      <Navigate to="/passenger" />}
                </PrivateRoute>
              } />

              <Route path="/passenger" element={
                <PrivateRoute role="PASSENGER">
                  <Layout onNavigate={navigate}>
                    <PassengerHome onNavigateWallet={() => navigate('/wallet')} />
                  </Layout>
                </PrivateRoute>
              } />

              <Route path="/driver" element={
                <PrivateRoute role="DRIVER">
                  <Layout onNavigate={navigate}>
                    <DriverHome />
                  </Layout>
                </PrivateRoute>
              } />

              <Route path="/admin" element={
                <PrivateRoute role="ADMIN">
                  <Layout onNavigate={navigate}>
                    <AdminHome />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/admin/team" element={
                <PrivateRoute role="ADMIN">
                  <Layout onNavigate={navigate}>
                    <TeamManagement />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/admin/settings" element={
                <PrivateRoute role="ADMIN">
                  <Layout onNavigate={navigate}>
                    <SystemSettings />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/admin/audit-logs" element={
                <PrivateRoute role="ADMIN">
                  <Layout onNavigate={navigate}>
                    <AuditLogs />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/admin/operations" element={
                <PrivateRoute role="ADMIN">
                  <Layout onNavigate={navigate}>
                    <OperationsMonitor />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/admin/reconciliation" element={
                <PrivateRoute role="ADMIN">
                  <Layout onNavigate={navigate}>
                    <Reconciliation />
                  </Layout>
                </PrivateRoute>
              } />

              <Route path="/wallet" element={
                <PrivateRoute>
                  <Layout onNavigate={navigate}>
                    <Wallet />
                  </Layout>
                </PrivateRoute>
              } />

              <Route path="/trips" element={
                <PrivateRoute>
                  <Layout onNavigate={navigate}>
                    <RideHistory />
                  </Layout>
                </PrivateRoute>
              } />

              <Route path="/profile" element={
                <PrivateRoute>
                  <Layout onNavigate={navigate}>
                    <UserProfile />
                  </Layout>
                </PrivateRoute>
              } />

              <Route path="/schedule" element={
                <PrivateRoute>
                  <Layout onNavigate={navigate}>
                    <ScheduleRides />
                  </Layout>
                </PrivateRoute>
              } />

              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </Suspense>
    </SimpleErrorBoundary>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppRoutes />
          <Toaster richColors closeButton position="top-center" />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
