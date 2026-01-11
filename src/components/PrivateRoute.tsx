import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface PrivateRouteProps {
    children: React.ReactNode;
    role?: UserRole;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, role }) => {
    const { isAuthenticated, user, isLoading, effectiveRole } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-mipana-darkBlue text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    <p className="text-sm font-medium animate-pulse">Cargando sesión...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirigir al login si no está autenticado, guardando la ubicación actual
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (role && effectiveRole !== role) {
        // Si el rol es insuficiente, redirigir a la home correspondiente
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default PrivateRoute;
