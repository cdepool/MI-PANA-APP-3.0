import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const RequestRide = lazy(() => import('./pages/traslados/RequestRide'));
const RideEstimation = lazy(() => import('./pages/traslados/RideEstimation'));
const RideActive = lazy(() => import('./pages/traslados/RideActive'));
const RideComplete = lazy(() => import('./pages/traslados/RideComplete'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Login = lazy(() => import('./pages/Login'));
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { UserRole } from './types';

// Shared Loading State
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Route */}
          <Route path="/welcome" element={<Onboarding />} />
          <Route path="/login" element={<Login onNavigateRegister={() => { }} />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />

          {/* Traslados Flow (Passenger Only) */}
          <Route path="/traslados" element={
            <ProtectedRoute allowedRoles={[UserRole.PASSENGER]}>
              <RequestRide />
            </ProtectedRoute>
          } />
          <Route path="/traslados/estimacion" element={
            <ProtectedRoute allowedRoles={[UserRole.PASSENGER]}>
              <RideEstimation />
            </ProtectedRoute>
          } />
          <Route path="/traslados/activo/:rideId" element={
            <ProtectedRoute>
              <RideActive />
            </ProtectedRoute>
          } />
          <Route path="/traslados/completado/:rideId" element={
            <ProtectedRoute>
              <RideComplete />
            </ProtectedRoute>
          } />

          {/* Placeholders */}
          <Route path="/billetera" element={
            <ProtectedRoute allowedRoles={[UserRole.PASSENGER, UserRole.DRIVER]}>
              <Wallet />
            </ProtectedRoute>
          } />
          <Route path="/tienda" element={<div className="p-8 text-center text-gray-500">Próximamente: Tienda</div>} />
          <Route path="/delivery" element={<div className="p-8 text-center text-gray-500">Próximamente: Delivery</div>} />

          {/* Catch all - Redirect to Home (which redirects to Welcome if needed) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
