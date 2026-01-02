import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  UserCheck,
  UserMinus,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import ProfessionalHeader from '../src/components/ProfessionalHeader';
import { userManagementService, UserProfile } from '../services/adminService';
import Button from '../components/Button';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'passenger' | 'driver'>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    let result = users;
    if (searchTerm) {
      result = result.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone.includes(searchTerm)
      );
    }
    if (roleFilter !== 'all') {
      result = result.filter(u => u.role === roleFilter);
    }
    setFilteredUsers(result);
  }, [searchTerm, roleFilter, users]);

  const loadUsers = async () => {
    setLoading(true);
    const data = await userManagementService.getUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleStatusUpdate = async (userId: string, newStatus: 'active' | 'suspended') => {
    const success = await userManagementService.updateUserStatus(userId, newStatus);
    if (success) {
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] font-sans">
      <ProfessionalHeader />
      
      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#001F3F]">Gestión de Usuarios</h1>
            <p className="text-gray-500 font-medium">Administra pasajeros, conductores y sus estados.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
              <Users size={18} className="text-cyan-500" />
              <span className="text-sm font-bold text-[#001F3F]">{users.length} Usuarios</span>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, email o teléfono..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mipana-navy/10 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-mipana-navy focus:outline-none"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
            >
              <option value="all">Todos los Roles</option>
              <option value="passenger">Pasajeros</option>
              <option value="driver">Conductores</option>
            </select>
            <button className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Usuario</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contacto</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rol</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-mipana-navy border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs font-bold text-gray-400">Cargando usuarios...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-sm font-bold text-gray-400">No se encontraron usuarios con los filtros aplicados.</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-mipana-navy/5 flex items-center justify-center text-mipana-navy font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#001F3F]">{user.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                              <Calendar size={10} /> Registrado: {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-600 flex items-center gap-2">
                            <Mail size={12} className="text-gray-400" /> {user.email}
                          </p>
                          <p className="text-xs font-medium text-gray-600 flex items-center gap-2">
                            <Phone size={12} className="text-gray-400" /> {user.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                          user.role === 'driver' ? 'bg-cyan-50 text-cyan-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                          {user.role === 'driver' ? 'Conductor' : 'Pasajero'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.status === 'active' ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                              <CheckCircle2 size={14} /> Activo
                            </span>
                          ) : user.status === 'pending' ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-orange-500">
                              <AlertTriangle size={14} /> Pendiente
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-500">
                              <XCircle size={14} /> Suspendido
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {user.status === 'suspended' ? (
                            <button 
                              onClick={() => handleStatusUpdate(user.id, 'active')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Activar Usuario"
                            >
                              <UserCheck size={18} />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleStatusUpdate(user.id, 'suspended')}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Suspender Usuario"
                            >
                              <UserMinus size={18} />
                            </button>
                          )}
                          <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserManagement;
