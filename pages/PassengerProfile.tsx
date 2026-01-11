import React, { useState, useEffect } from 'react';
import {
  User, Phone, Mail, MapPin, Lock, Settings, HelpCircle,
  ChevronDown, Edit2, Check, AlertCircle, Save, X,
  Clock, ChevronRight, Wallet, LogOut, ShieldCheck, WifiOff, Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner';

interface PassengerProfileData {
  id: string;
  full_name: string;
  cedula: string;
  birth_date: string;
  phone: string;
  email: string;
  avatar_url?: string;
  membership: string;
  rating: number;
  total_trips: number;
  points: number;
}

const CACHE_KEY = 'mipana_passenger_profile';

export default function PassengerProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PassengerProfileData | null>(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  });
  const [formData, setFormData] = useState<Partial<PassengerProfileData>>({});
  const [loading, setLoading] = useState(!profile);
  const [isEditing, setIsEditing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeTab, setActiveTab] = useState<'activity' | 'personal'>('activity');

  useEffect(() => {
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData(data);
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (isOnline) {
        toast.error('Error al actualizar datos del servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PassengerProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user || !formData || !isOnline) {
      if (!isOnline) toast.error('Debes estar en línea para guardar cambios');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone
        })
        .eq('id', user.id);

      if (error) throw error;

      const updatedProfile = { ...profile, ...formData } as PassengerProfileData;
      setProfile(updatedProfile);
      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedProfile));
      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar perfil');
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-slate-900">
        <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Cargando tu perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center py-1 px-4 text-xs font-bold flex items-center justify-center gap-2 sticky top-0 z-50">
          <WifiOff size={14} /> MODO OFFLINE - Datos locales mostrados
        </div>
      )}

      {/* Header Mobile-First */}
      <div className="bg-[#1A2E56] dark:bg-slate-900 text-white pt-10 pb-16 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 max-w-lg mx-auto">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-20 h-20 rounded-3xl bg-slate-200 dark:bg-slate-800 border-4 border-white/10 overflow-hidden shadow-xl ring-4 ring-[#FF6B00]/20">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-slate-500">
                    <User size={32} />
                  </div>
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 bg-[#FF6B00] p-2 rounded-xl border-2 border-[#1A2E56] shadow-lg active:scale-95 transition-transform">
                <Edit2 size={12} className="text-white" />
              </button>
            </div>

            <div className="flex-1">
              <h1 className="text-xl font-bold truncate">{profile?.full_name || 'Pasajero Pana'}</h1>
              <div className="flex items-center gap-2 text-cyan-200/80 text-sm font-medium mt-0.5">
                <ShieldCheck size={14} />
                <span>{profile?.membership || 'Miembro Estándar'}</span>
              </div>
              <div className="flex gap-3 mt-3">
                <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1.5 ring-1 ring-white/20">
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  {profile?.rating || '0.0'}
                </div>
                <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1.5 ring-1 ring-white/20">
                  <Wallet size={10} className="text-green-400" />
                  {profile?.points?.toLocaleString() || '0'} Puntos
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Floating Overlay */}
      <div className="max-w-md mx-auto px-6 -mt-8 relative z-20">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-xl border border-slate-100 dark:border-slate-700 flex justify-around items-center">
          <div className="text-center">
            <p className="text-2xl font-black text-[#1A2E56] dark:text-white">{profile?.total_trips || '0'}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Viajes</p>
          </div>
          <div className="h-8 w-px bg-slate-100 dark:bg-slate-700"></div>
          <div className="text-center">
            <p className="text-2xl font-black text-[#FF6B00]">{profile?.rating || '5.0'}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rating</p>
          </div>
          <div className="h-8 w-px bg-slate-100 dark:bg-slate-700"></div>
          <div className="text-center">
            <p className="text-2xl font-black text-blue-500">1º</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nivel</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-md mx-auto px-6 mt-8">
        <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl">
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'activity' ? 'bg-white dark:bg-slate-800 shadow-sm text-[#FF6B00]' : 'text-slate-400'}`}
          >
            Actividad
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'personal' ? 'bg-white dark:bg-slate-800 shadow-sm text-[#FF6B00]' : 'text-slate-400'}`}
          >
            Perfil
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-md mx-auto px-6 mt-6 space-y-6">

        {activeTab === 'activity' && (
          <div className="space-y-4 animate-fade-in">
            <button
              onClick={() => navigate('/trips')}
              className="w-full flex items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 group hover:border-[#FF6B00]/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                  <Clock size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-700 dark:text-slate-200">Historial de Viajes</p>
                  <p className="text-xs text-slate-400 font-medium">Mira dónde has estado</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-[#FF6B00] transition-colors" />
            </button>

            <button
              onClick={() => navigate('/wallet')}
              className="w-full flex items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 group hover:border-green-500/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-2xl">
                  <Wallet size={24} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-700 dark:text-slate-200">Billetera y Pagos</p>
                  <p className="text-xs text-slate-400 font-medium">Saldo y métodos de pago</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-green-500 transition-colors" />
            </button>

            <div className="pt-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3">Preferencias</p>
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-50 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Mis Lugares</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
                <div className="flex items-center justify-between p-4">
                  <Settings size={18} className="text-slate-400" />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Preferencias de Viaje</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'personal' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest">Datos Personales</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 text-xs font-black text-[#FF6B00] uppercase hover:opacity-80 transition-opacity"
                  >
                    <Edit2 size={12} /> Editar
                  </button>
                ) : (
                  <div className="flex gap-4">
                    <button onClick={() => setIsEditing(false)} className="text-xs font-black text-slate-400 uppercase">Cancelar</button>
                    <button onClick={handleSave} className="text-xs font-black text-blue-500 uppercase">Guardar</button>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#1A2E56]/40 dark:text-slate-500 uppercase tracking-tight ml-1">Nombre Completo</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={isEditing ? (formData.full_name || '') : (profile?.full_name || '')}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 rounded-2xl border transition-all font-bold text-slate-700 dark:text-white ${isEditing ? 'border-[#FF6B00] bg-white dark:bg-slate-900 ring-4 ring-[#FF6B00]/10' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 opacity-100'}`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#1A2E56]/40 dark:text-slate-500 uppercase tracking-tight ml-1">Teléfono</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={isEditing ? (formData.phone || '') : (profile?.phone || '')}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 rounded-2xl border transition-all font-bold text-slate-700 dark:text-white ${isEditing ? 'border-[#FF6B00] bg-white dark:bg-slate-900 ring-4 ring-[#FF6B00]/10' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'}`}
                    />
                    {!isEditing && <Check size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-[#1A2E56]/40 dark:text-slate-500 uppercase tracking-tight ml-1">Correo Electrónico</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profile?.email || ''}
                      disabled
                      className="w-full px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-bold text-slate-400"
                    />
                    <Lock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full py-5 rounded-3xl bg-red-50 dark:bg-red-900/10 text-red-500 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
            >
              <LogOut size={18} /> Cerrar Sesión
            </button>
          </div>
        )}

        <div className="text-center py-6">
          <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-[4px]">Mi Pana App v3.0</p>
        </div>
      </div>
    </div>
  );
}
