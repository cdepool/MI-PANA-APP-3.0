import React from 'react';
import { DollarSign, TrendingUp, AlertCircle, Car } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import ProfessionalHeader from '../src/components/ProfessionalHeader';

import { adminService, AdminStats } from '../services/adminService';

const statsInitial = [
  { title: 'Facturación Bruta', value: '---', sub: 'Calculando...', icon: DollarSign, color: 'border-blue-600' },
  { title: 'Conductores Activos', value: '---', sub: 'Registrados', icon: Car, color: 'border-cyan-400' },
  { title: 'Aprobaciones', value: '---', sub: 'Pendientes', icon: AlertCircle, color: 'border-orange-500' },
  { title: 'Usuarios Totales', value: '---', sub: 'Registrados', icon: TrendingUp, color: 'border-gray-400' },
];

const ProfessionalAdminDashboard: React.FC = () => {
  const [statsData, setStatsData] = React.useState<AdminStats | null>(null);

  React.useEffect(() => {
    const loadStats = async () => {
      const data = await adminService.getDashboardStats();
      setStatsData(data);
    };
    loadStats();
  }, []);

  const displayStats = [
    { ...statsInitial[0], value: statsData ? `$${statsData.totalRevenueUsd.toFixed(2)}` : '...' },
    { ...statsInitial[1], value: statsData ? statsData.activeDrivers : '...' },
    { ...statsInitial[2], value: statsData ? statsData.pendingApprovals : '...' },
    { ...statsInitial[3], value: statsData ? statsData.totalUsers : '...' },
  ];

  const pieData = [
    { name: 'Conductores', value: 75, color: '#00BCD4' },
    { name: 'Next TV C.A.', value: 15, color: '#001F3F' },
    { name: 'SENIAT', value: 10, color: '#FF9800' },
  ];

  const barData = [
    { name: 'Mototaxi', pago: 25, neto: 2, seniat: 1 },
    { name: 'El Pana', pago: 65, neto: 3, seniat: 2 },
    { name: 'El Amigo', pago: 52, neto: 2, seniat: 1 },
    { name: 'Full Pana', pago: 48, neto: 2, seniat: 2 },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7F6] font-sans">
      <ProfessionalHeader />

      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#001F3F]">Dashboard Administrativo</h1>
            <p className="text-gray-500 font-medium">Next TV C.A. | Sistema de Gestión Financiera</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Tasa Oficial BCV</p>
              <p className="text-lg font-bold text-green-600">Bs 330.38</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {displayStats.map((stat, i) => (
            <div key={i} className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${stat.color} hover:shadow-md transition-shadow`}>
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-tight">{stat.title}</p>
                <stat.icon className="text-gray-300" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-[#001F3F] mb-1">{stat.value}</h3>
              <p className="text-xs font-medium text-gray-500">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
            <h3 className="text-lg font-bold text-[#001F3F] mb-6">Distribución de Ingresos</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="font-medium text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-[#001F3F]">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
            <h3 className="text-lg font-bold text-[#001F3F] mb-6">Análisis Financiero por Servicio</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="pago" name="Pago Conductor" stackId="a" fill="#00BCD4" />
                  <Bar dataKey="neto" name="Neto App" stackId="a" fill="#001F3F" />
                  <Bar dataKey="seniat" name="SENIAT" stackId="a" fill="#FF9800" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfessionalAdminDashboard;
