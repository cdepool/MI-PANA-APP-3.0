

import React, { useState, useEffect } from 'react';
import { Users, Car, DollarSign, TrendingUp, AlertCircle, RefreshCw, ArrowRight, Clock, MapPin, Navigation } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AdminUserCreationModal } from '../components/admin/AdminUserCreationModal';
import { LoadingSpinner } from '../components/admin/LoadingSpinner';
import { ErrorState } from '../components/admin/ErrorState';
import { EmptyState } from '../components/admin/EmptyState';
import DriverAlertsPanel from '../components/admin/DriverAlertsPanel';
import { adminService, AdminStats, RevenueData, LiveTrip } from '../services/adminService';
import { getTariffs } from '../services/mockService';

const AdminHome: React.FC = () => {
  // State management
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [revenueByService, setRevenueByService] = useState<RevenueData[]>([]);
  const [liveTrips, setLiveTrips] = useState<LiveTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [currentViewRate, setCurrentViewRate] = useState<number>(0);

  // Load all dashboard data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [dashboardStats, revData, trips] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getRevenueByService(),
          adminService.getLiveTrips()
        ]);

        setStats(dashboardStats);
        setRevenueByService(revData);
        setLiveTrips(trips);
        setCurrentViewRate(getTariffs().currentBcvRate);
      } catch (err) {
        console.error("Error loading admin data", err);
        setError('Error al cargar los datos del dashboard. Por favor, intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate distribution data
  const distributionData = stats ? [
    { name: 'Conductores', value: stats.totalRevenueUsd * 0.92, color: '#04A8BF' },
    { name: 'Next TV C.A.', value: stats.totalRevenueUsd * 0.05, color: '#022859' },
    { name: 'SENIAT', value: stats.totalRevenueUsd * 0.03, color: '#F2620F' },
  ] : [];

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Cargando dashboard..." />;
  }

  // Error state
  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">

      <AdminUserCreationModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} />

      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-mipana-darkBlue dark:text-white">Dashboard Administrativo</h1>
          <p className="text-xs text-gray-500">Next TV C.A. | Sistema de Gestión Financiera</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsUserModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-mipana-mediumBlue text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-bold shadow-md"
          >
            <Users size={16} />
            <span className="whitespace-nowrap">Crear Usuario</span>
          </button>

          <div className="flex-1 sm:flex-none text-right px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 relative overflow-hidden min-w-[140px]">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center justify-end gap-1">
              <RefreshCw size={10} className="animate-spin-slow" /> BCV
            </p>
            <div className="flex items-center justify-end gap-2">
              <span className="font-mono font-bold text-lg md:text-xl text-green-600 dark:text-green-400">
                Bs {currentViewRate.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Facturación Bruta"
          value={`$${stats?.totalRevenueUsd.toFixed(2) || '0.00'}`}
          subValue={`≈ Bs ${((stats?.totalRevenueUsd || 0) * currentViewRate).toLocaleString('es-VE', { maximumFractionDigits: 2 })}`}
          icon={<DollarSign />}
          color="#022859"
        />
        <StatCard
          title="Ingreso Neto App"
          value={`$${((stats?.totalRevenueUsd || 0) * 0.05).toFixed(2)}`}
          subValue="Libre de impuestos"
          icon={<TrendingUp />}
          color="#04A8BF"
        />
        <StatCard
          title="Retenciones SENIAT"
          value={`$${((stats?.totalRevenueUsd || 0) * 0.03).toFixed(2)}`}
          subValue="IVA + ISLR"
          icon={<AlertCircle />}
          color="#F2620F"
        />
        <StatCard
          title="Usuarios Totales"
          value={stats?.totalUsers || 0}
          subValue="Registrados"
          icon={<Users />}
          color="#666"
        />
      </div>

      {/* Operational Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Viajes Activos"
          value={stats?.activeTrips || 0}
          icon={<Car />}
          color="blue"
        />
        <MetricCard
          title="Conductores Online"
          value={stats?.onlineDrivers || 0}
          icon={<Users />}
          color="green"
        />
        <MetricCard
          title="Recargas Pendientes"
          value={stats?.pendingRecharges || 0}
          icon={<AlertCircle />}
          color="orange"
        />
        <MetricCard
          title="Viajes Hoy"
          value={stats?.todayTrips || 0}
          icon={<TrendingUp />}
          color="purple"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4">Distribución de Ingresos</h3>
          {distributionData.length > 0 && distributionData.some(d => d.value > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Monto']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No hay datos de distribución disponibles" />
          )}
        </div>

        {/* Service Stacked Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4">Análisis Financiero por Servicio</h3>
          {revenueByService.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByService} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Legend />
                  <Bar dataKey="pago" name="Total Pago" fill="#04A8BF" />
                  <Bar dataKey="neto" name="Neto App" fill="#022859" />
                  <Bar dataKey="seniat" name="SENIAT" fill="#F2620F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No hay datos de servicios disponibles" />
          )}
        </div>
      </div>

      {/* Detailed Data Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Navigation size={18} className="text-mipana-mediumBlue" />
                Viajes Recientes en Vivo
              </h3>
              <button
                className="text-xs font-bold text-mipana-mediumBlue hover:underline flex items-center gap-1"
                onClick={() => navigate('/admin/operations')}
              >
                Ver monitoreo en vivo
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4">Pasajero / Conductor</th>
                    <th className="px-6 py-4">Ruta</th>
                    <th className="px-6 py-4">Tarifa</th>
                    <th className="px-6 py-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {liveTrips.length > 0 ? (
                    liveTrips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-white text-xs">{trip.passenger_name}</span>
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Car size={10} className="text-mipana-mediumBlue" />
                              {trip.driver_name || 'Buscando conductor...'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400">
                              <MapPin size={10} className="text-green-500 shrink-0" />
                              <span className="truncate max-w-[120px]">{trip.origin.split(',')[0]}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400">
                              <Navigation size={10} className="text-mipana-orange shrink-0" />
                              <span className="truncate max-w-[120px]">{trip.destination.split(',')[0]}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-white text-xs">${trip.price_usd?.toFixed(2)}</span>
                            <span className="text-[10px] text-gray-500">Bs {(trip.price_usd * currentViewRate).toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={trip.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-20">
                        <div className="flex flex-col items-center justify-center opacity-40">
                          <Clock size={40} className="text-gray-400 mb-2" />
                          <p className="text-sm font-medium">No hay viajes activos en este momento</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-center">
              <button className="text-xs font-bold text-mipana-mediumBlue hover:underline">Ver historial completo de viajes</button>
            </div>
          </div>
        </div>

        {/* Right Column: Alerts & Sidebars */}
        <div className="space-y-6">
          <DriverAlertsPanel />
        </div>
      </div>
    </div>
  );
};

// StatCard Component
const StatCard = ({ title, value, subValue, icon, color }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: color }}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
        {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
      </div>
      <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
        {icon}
      </div>
    </div>
  </div>
);

// MetricCard Component
const MetricCard = ({ title, value, icon, color }: any) => {
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border-l-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
        </div>
        <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
          {icon}
        </div>
      </div>
    </div>
  );
};


// StatusBadge Component
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    REQUESTED: { label: 'Solicitado', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    MATCHING: { label: 'Buscando', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    ACCEPTED: { label: 'Aceptado', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    IN_PROGRESS: { label: 'En Curso', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    COMPLETED: { label: 'Completado', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  };

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
};

export default AdminHome;
