import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Lock, Settings, HelpCircle, ChevronDown, Edit2, Check, AlertCircle, Save, X, Clock, ChevronRight, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner';

interface PassengerProfile {
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

export default function PassengerProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PassengerProfile | null>(null);
  const [formData, setFormData] = useState<Partial<PassengerProfile>>({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    personal: true,
    preferences: false,
    locations: false,
    security: false,
  });

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
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PassengerProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user || !formData) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? ({ ...prev, ...formData } as PassengerProfile) : null);
      setIsEditing(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar perfil');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando perfil...</div>;
  }

  if (!profile) {
    return <div className="flex items-center justify-center h-screen">No se encontró el perfil</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con información del usuario */}
      <div className="bg-gradient-to-r from-mipana-navy via-mipana-cyan to-mipana-navy text-white p-8">
        <div className="max-w-6xl mx-auto flex items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-gray-600" />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              13
            </div>
          </div>

          {/* Información principal */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{profile.full_name}</h1>
            <p className="text-cyan-200">{profile.cedula}</p>

            {/* Badges */}
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">Membresía: {profile.membership}</span>
              <span className="bg-orange-500 px-3 py-1 rounded-full text-sm">Calificación: {profile.rating}/5.0</span>
              <span className="bg-gray-600 px-3 py-1 rounded-full text-sm">{profile.points.toLocaleString()} Puntos</span>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{profile.total_trips}</div>
              <div className="text-sm text-cyan-200">Viajes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{profile.rating}</div>
              <div className="text-sm text-cyan-200">Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-4 gap-6">
          {/* Sidebar de navegación */}
          <div className="col-span-1">
            <nav className="space-y-2">
              {[
                { icon: User, label: 'Información Personal', id: 'personal' },
                { icon: Phone, label: 'Teléfonos Móviles', id: 'phones' },
                { icon: MapPin, label: 'Ubicaciones Guardadas', id: 'locations' },
                { icon: Settings, label: 'Configuración', id: 'settings' },
                { icon: HelpCircle, label: 'Ayuda', id: 'help' },
              ].map(({ icon: Icon, label, id }) => (
                <button
                  key={id}
                  onClick={() => toggleSection(id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 text-left transition-colors"
                >
                  <Icon className="w-5 h-5 text-mipana-navy" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Contenido principal */}
          <div className="col-span-3 space-y-6">

            {/* Sección: Mi Actividad (Viajes y Pagos) */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h3 className="font-bold text-lg text-mipana-darkBlue mb-4">Mi Actividad</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => navigate('/trips')} className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white text-blue-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                        <Clock size={20} />
                      </div>
                      <span className="font-bold text-gray-700">Historial de Viajes</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-500" />
                  </button>

                  <button onClick={() => navigate('/wallet')} className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group border border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white text-green-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                        <Wallet size={20} />
                      </div>
                      <span className="font-bold text-gray-700">Billetera y Pagos</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-green-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sección: Información Personal */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                onClick={() => toggleSection('personal')}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-mipana-navy" />
                  <div className="text-left">
                    <h2 className="font-bold text-lg">Mi Información Personal</h2>
                    <p className="text-sm text-gray-600">Datos básicos de tu cuenta</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.personal ? 'rotate-180' : ''}`} />
              </button>

              {expandedSections.personal && (
                <div className="border-t border-gray-200 p-6 space-y-4">
                  <div className="flex justify-end gap-2 mb-4">
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        <Edit2 size={16} /> Editar Información
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setFormData(profile || {});
                          }}
                          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 px-3 py-1 bg-gray-100 rounded-md text-sm"
                        >
                          <X size={16} /> Cancelar
                        </button>
                        <button
                          onClick={handleSave}
                          className="flex items-center gap-1 text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-sm shadow-sm"
                        >
                          <Save size={16} /> Guardar
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={formData.full_name || ''}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          disabled={!isEditing}
                          className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${isEditing ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'
                            }`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cédula de Identidad</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={profile.cedula}
                          disabled
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 opacity-70"
                        />
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">No editable</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento</label>
                      <input
                        type="text"
                        value={profile.birth_date}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono Principal</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={formData.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          disabled={!isEditing}
                          className={`flex-1 px-3 py-2 border rounded-lg transition-colors ${isEditing ? 'border-blue-300 bg-white' : 'border-gray-300 bg-gray-50'
                            }`}
                        />
                        {!isEditing && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                            <Check className="w-3 h-3" /> Verificado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 opacity-70"
                      />
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                        <Check className="w-3 h-3" /> Verificado
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sección: Preferencias de Viaje */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 border-dashed border-orange-300">
              <button
                onClick={() => toggleSection('preferences')}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-orange-500" />
                  <div className="text-left">
                    <h2 className="font-bold text-lg">Mis Preferencias de Viaje</h2>
                    <p className="text-sm text-gray-600">Configura tus preferencias para una mejor experiencia</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.preferences ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Sección: Ubicaciones Guardadas */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 border-dashed border-orange-300">
              <button
                onClick={() => toggleSection('locations')}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  <div className="text-left">
                    <h2 className="font-bold text-lg">Mis Ubicaciones Guardadas</h2>
                    <p className="text-sm text-gray-600">Lugares frecuentes para viajes rápidos</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${expandedSections.locations ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
