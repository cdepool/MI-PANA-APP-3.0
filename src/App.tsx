import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'));
const RequestRide = lazy(() => import('./pages/traslados/RequestRide'));
const RideEstimation = lazy(() => import('./pages/traslados/RideEstimation'));
const RideActive = lazy(() => import('./pages/traslados/RideActive'));
const RideComplete = lazy(() => import('./pages/traslados/RideComplete'));

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
          <Route path="/" element={<Home />} />

          {/* Traslados Flow */}
          <Route path="/traslados" element={<RequestRide />} />
          <Route path="/traslados/estimacion" element={<RideEstimation />} />
          <Route path="/traslados/activo/:rideId" element={<RideActive />} />
          <Route path="/traslados/completado/:rideId" element={<RideComplete />} />

          {/* Placeholders for other services */}
          <Route path="/billetera" element={<div className="p-8 text-center text-gray-500">Próximamente: Billetera</div>} />
          <Route path="/tienda" element={<div className="p-8 text-center text-gray-500">Próximamente: Tienda</div>} />
          <Route path="/delivery" element={<div className="p-8 text-center text-gray-500">Próximamente: Delivery</div>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
