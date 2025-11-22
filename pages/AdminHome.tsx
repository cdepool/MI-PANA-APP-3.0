
import React, { useMemo, useState, useEffect } from 'react';
import { Users, Car, DollarSign, TrendingUp, AlertCircle, Calendar, RefreshCw, MessageSquare, Eye, X } from 'lucide-react';
import { getTariffs, SERVICE_CATALOG, mockBcvRate } from '../services/mockService';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChatMessage, UserRole } from '../types';
import { AdminUserCreationModal } from '../components/admin/AdminUserCreationModal';

// Generate data using the CURRENT BCV RATE to ensure consistency
const generateAdminData = (currentRate: number) => {
  // Create 50 random rides
  const rides = Array.from({ length: 50 }).map((_, i) => {
    const service = SERVICE_CATALOG[Math.floor(Math.random() * SERVICE_CATALOG.length)];
    const distance = Math.random() * 15 + 2; // 2 to 17 km

    const pfs = service.pfs_base_usd + (distance > 6 ? (distance - 6) * service.pfs_km_adicional_usd : 0);

    // Generate fake chat history for some rides
    let chats: ChatMessage[] = [];
    if (i % 3 === 0) {
      chats = [
        { id: '1', senderRole: UserRole.PASSENGER, senderName: 'Pasajero', text: 'Hola, ¿dónde estás?', timestamp: new Date(), read: true },
        { id: '2', senderRole: UserRole.DRIVER, senderName: 'Conductor', text: 'Llego en 2 minutos', timestamp: new Date(), read: true }
      ];
    }

    return {
      id: `R-${1000 + i}`,
      serviceName: service.nombre,
      pfs_usd: pfs,
      pfs_ves: pfs * currentRate,
      conductor_neto: pfs * 0.95 * 0.97,
      app_neto: (pfs * 0.05) / 1.16,
      seniat_total: (pfs * 0.95 * 0.03) + ((pfs * 0.05) - ((pfs * 0.05) / 1.16)),
      status: Math.random() > 0.2 ? 'COMPLETED' : 'CANCELLED',
      rate_used: currentRate,
      chatLogs: chats
    };
  });
  return rides.filter(r => r.status === 'COMPLETED');
};

const AdminHome: React.FC = () => {
  // State to hold current rate for the view
  const [currentViewRate, setCurrentViewRate] = useState<number>(mockBcvRate);
  const [selectedRideLogs, setSelectedRideLogs] = useState<ChatMessage[] | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Polling for rate updates to keep dashboard live
  useEffect(() => {
    const interval = setInterval(() => {
      const latest = getTariffs().currentBcvRate;
      if (latest !== currentViewRate) {
        setCurrentViewRate(latest);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [currentViewRate]);

  const data = useMemo(() => generateAdminData(currentViewRate), [currentViewRate]);

  // KPI Calculations
  const totalViajes = data.length;
  const totalFacturado = data.reduce((acc, r) => acc + r.pfs_usd, 0);
  const totalAppNeto = data.reduce((acc, r) => acc + r.app_neto, 0);
  const totalSeniat = data.reduce((acc, r) => acc + r.seniat_total, 0);
  const totalConductor = data.reduce((acc, r) => acc + r.conductor_neto, 0);

  const distributionData = [
    { name: 'Conductores', value: totalConductor, color: '#04A8BF' }, // Mipana Medium Blue
    { name: 'Next TV C.A.', value: totalAppNeto, color: '#022859' }, // Mipana Dark Blue
    { name: 'SENIAT', value: totalSeniat, color: '#F2620F' }, // Mipana Orange
  ];

  const serviceData = SERVICE_CATALOG.map(s => {
    const ridesOfService = data.filter(r => r.serviceName === s.nombre);
    return {
      name: s.nombre,
      conductor: ridesOfService.reduce((acc, r) => acc + r.conductor_neto, 0),
      app: ridesOfService.reduce((acc, r) => acc + r.app_neto, 0),
      seniat: ridesOfService.reduce((acc, r) => acc + r.seniat_total, 0),
    };
  });

  const StatCard = ({ title, value, subValue, icon, color }: any) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
          {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
        </div>
        <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-12 relative">

      {/* AUDIT LOG MODAL */}
      {selectedRideLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                <MessageSquare size={20} className="text-mipana-mediumBlue" /> Auditoría de Chat
              </h3>
              <button onClick={() => setSelectedRideLogs(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
              {selectedRideLogs.length === 0 ? (
                <p className="text-center text-gray-400 italic">No se registraron mensajes en este viaje.</p>
              ) : (
                selectedRideLogs.map((msg, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${msg.senderRole === UserRole.PASSENGER ? 'bg-white border-gray-200 ml-0 mr-8' : 'bg-blue-50 border-blue-100 ml-8 mr-0'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs font-bold uppercase ${msg.senderRole === UserRole.PASSENGER ? 'text-gray-600' : 'text-blue-600'}`}>{msg.senderName} ({msg.senderRole})</span>
                      <span className="text-[10px] text-gray-400">{msg.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-gray-800">{msg.text}</p>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
              <p className="text-xs text-gray-500 text-center">Registro inmutable para fines de soporte.</p>
            </div>
          </div>
        </div>
      )}

      <AdminUserCreationModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} />

      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-mipana-darkBlue dark:text-white">Dashboard Administrativo</h1>
          <p className="text-xs text-gray-500">Next TV C.A. | Sistema de Gestión Financiera</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsUserModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-mipana-mediumBlue text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-bold shadow-md"
          >
            <Users size={16} />
            Crear Usuario
          </button>

          <div className="text-right px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center justify-end gap-1">
              <RefreshCw size={10} className="animate-spin-slow" /> Tasa Oficial BCV
            </p>
            <div className="flex items-center justify-end gap-2">
              <span className="font-mono font-bold text-xl text-green-600 dark:text-green-400">Bs {currentViewRate.toFixed(2)}</span>
            </div>
            <p className="text-[9px] text-gray-400">Fuente: DolarAPI (BCV)</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Facturación Bruta"
          value={`$${totalFacturado.toFixed(2)}`}
          subValue={`≈ Bs ${(totalFacturado * currentViewRate).toLocaleString('es-VE', { maximumFractionDigits: 2 })}`}
          icon={<DollarSign />}
          color="#022859"
        />
        <StatCard
          title="Ingreso Neto App"
          value={`$${totalAppNeto.toFixed(2)}`}
          subValue="Libre de impuestos"
          icon={<TrendingUp />}
          color="#04A8BF"
        />
        <StatCard
          title="Retenciones SENIAT"
          value={`$${totalSeniat.toFixed(2)}`}
          subValue="IVA + ISLR"
          icon={<AlertCircle />}
          color="#F2620F"
        />
        <StatCard
          title="Viajes Totales"
          value={totalViajes}
          subValue="Este mes"
          icon={<Car />}
          color="#666"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4">Distribución de Ingresos</h3>
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
        </div>

        {/* Service Stacked Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4">Análisis Financiero por Servicio</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                  cursor={{ fill: 'transparent' }}
                />
                <Legend />
                <Bar dataKey="conductor" name="Pago Conductor" stackId="a" fill="#04A8BF" />
                <Bar dataKey="app" name="Neto App" stackId="a" fill="#022859" />
                <Bar dataKey="seniat" name="SENIAT" stackId="a" fill="#F2620F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 dark:text-white">Detalle de Liquidaciones (Simulación)</h3>
          <button className="text-xs text-mipana-mediumBlue font-bold hover:underline flex items-center gap-1">
            <Calendar size={14} /> Exportar Reporte Fiscal
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-3">ID Viaje</th>
                <th className="px-6 py-3">Servicio</th>
                <th className="px-6 py-3 text-right">PFS (USD)</th>
                <th className="px-6 py-3 text-right">Neto App</th>
                <th className="px-6 py-3 text-right">Tasa</th>
                <th className="px-6 py-3 text-center">Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.slice(0, 10).map((ride, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{ride.id}</td>
                  <td className="px-6 py-4 dark:text-gray-300">{ride.serviceName}</td>
                  <td className="px-6 py-4 text-right font-bold dark:text-white">${ride.pfs_usd.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-blue-600">${ride.app_neto.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-xs text-gray-400">{ride.rate_used.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedRideLogs(ride.chatLogs)}
                      className="text-mipana-mediumBlue hover:bg-blue-50 p-1.5 rounded-md transition-colors"
                      title="Ver Logs de Chat"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
