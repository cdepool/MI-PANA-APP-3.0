import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Users, Car, DollarSign, Clock, AlertTriangle, Shield } from 'lucide-react';
import { adminService, AdminStats } from '../services/adminService';
import OperationsMonitor from '../components/admin/OperationsMonitor';
import ReconciliationPanel from '../components/admin/ReconciliationPanel';

const AdminOperations: React.FC = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            const data = await adminService.getDashboardStats();
            setStats(data);
            setLoading(false);
        };
        loadStats();

        // Refresh stats every minute
        const interval = setInterval(loadStats, 60000);
        return () => clearInterval(interval);
    }, []);

    const statCards = [
        {
            label: 'Viajes Activos',
            value: stats?.activeTrips || 0,
            icon: Activity,
            color: 'text-cyan-600 bg-cyan-100',
            pulse: stats?.activeTrips && stats.activeTrips > 0,
        },
        {
            label: 'Conductores Online',
            value: stats?.onlineDrivers || 0,
            icon: Car,
            color: 'text-green-600 bg-green-100',
        },
        {
            label: 'Viajes Hoy',
            value: stats?.todayTrips || 0,
            icon: TrendingUp,
            color: 'text-blue-600 bg-blue-100',
        },
        {
            label: 'Recargas Pendientes',
            value: stats?.pendingRecharges || 0,
            icon: Clock,
            color: 'text-orange-600 bg-orange-100',
            alert: stats?.pendingRecharges && stats.pendingRecharges > 5,
        },
        {
            label: 'Usuarios Totales',
            value: stats?.totalUsers || 0,
            icon: Users,
            color: 'text-purple-600 bg-purple-100',
        },
        {
            label: 'Ingresos Totales',
            value: `$${(stats?.totalRevenueUsd || 0).toFixed(2)}`,
            icon: DollarSign,
            color: 'text-emerald-600 bg-emerald-100',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-mipana-navy to-mipana-mediumBlue px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                            <Shield size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Centro de Operaciones</h1>
                            <p className="text-white/70 text-sm">Monitoreo en tiempo real de MI PANA APP</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    {statCards.map((stat, i) => (
                        <div
                            key={i}
                            className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${stat.alert ? 'ring-2 ring-orange-300' : ''
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                                    <stat.icon size={16} />
                                </div>
                                {stat.pulse && (
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                )}
                            </div>
                            <p className="text-2xl font-bold text-gray-900">
                                {loading ? '...' : stat.value}
                            </p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Operations Monitor */}
                    <OperationsMonitor />

                    {/* Reconciliation Panel */}
                    <ReconciliationPanel />
                </div>

                {/* Quick Actions */}
                <div className="mt-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-orange-500" />
                        Acciones Rápidas
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button
                            onClick={() => window.location.href = '/admin/approvals'}
                            className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
                        >
                            <Users size={24} className="text-mipana-navy mb-2" />
                            <p className="font-medium text-sm">Aprobaciones</p>
                            <p className="text-xs text-gray-500">Conductores pendientes</p>
                        </button>

                        <button
                            onClick={() => window.location.href = '/admin/users'}
                            className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
                        >
                            <Shield size={24} className="text-mipana-navy mb-2" />
                            <p className="font-medium text-sm">Gestión Usuarios</p>
                            <p className="text-xs text-gray-500">Ver y editar usuarios</p>
                        </button>

                        <button
                            onClick={() => window.location.href = '/admin/dashboard'}
                            className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
                        >
                            <TrendingUp size={24} className="text-mipana-navy mb-2" />
                            <p className="font-medium text-sm">Dashboard KPI</p>
                            <p className="text-xs text-gray-500">Métricas y reportes</p>
                        </button>

                        <button
                            onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                            className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
                        >
                            <Activity size={24} className="text-mipana-navy mb-2" />
                            <p className="font-medium text-sm">Supabase</p>
                            <p className="text-xs text-gray-500">Base de datos</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOperations;
