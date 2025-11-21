
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { User as UserIcon, Mail, Star, Shield, Award, Edit2, LogOut, Check, X, Camera } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';

const UserProfile: React.FC = () => {
  const { user, updateProfile, connectGoogle, disconnectGoogle } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatarUrl: user?.avatarUrl || ''
  });

  if (!user) return null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      alert("Error al actualizar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up pb-12">
      
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-mipana-darkBlue to-mipana-mediumBlue"></div>
        <div className="px-6 pb-6 relative">
          <div className="absolute -top-16 left-6 group">
            <div className="relative">
              <img 
                src={isEditing ? formData.avatarUrl : user.avatarUrl} 
                alt={user.name} 
                className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-md object-cover bg-white"
              />
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer">
                   <Camera className="text-white" size={24} />
                </div>
              )}
            </div>
          </div>
          
          <div className="ml-40 pt-2 flex justify-between items-start">
             <div>
               {isEditing ? (
                  <input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="text-2xl font-bold dark:text-white bg-transparent border-b border-mipana-mediumBlue focus:outline-none w-full"
                  />
               ) : (
                  <h2 className="text-2xl font-bold dark:text-white">{user.name}</h2>
               )}
               <p className="text-mipana-mediumBlue font-medium flex items-center gap-1">
                 {user.role === UserRole.DRIVER ? 'Conductor Certificado' : 'Pasajero'} 
                 {user.role === UserRole.ADMIN && <Shield size={16} />}
               </p>
             </div>
             {!isEditing && (
               <button 
                 onClick={() => setIsEditing(true)}
                 className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full hover:bg-gray-200 transition-colors"
               >
                 <Edit2 size={18} className="text-gray-600 dark:text-gray-300" />
               </button>
             )}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                   <Mail className="text-gray-400 shrink-0" />
                   <div className="w-full">
                      <p className="text-xs text-gray-400">Correo Electrónico</p>
                      {isEditing ? (
                        <input 
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="font-medium bg-transparent border-b border-gray-300 focus:outline-none w-full"
                        />
                      ) : (
                        <p className="font-medium truncate">{user.email}</p>
                      )}
                   </div>
                </div>
                
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                   <UserIcon className="text-gray-400 shrink-0" />
                   <div>
                      <p className="text-xs text-gray-400">Cédula / ID</p>
                      <p className="font-medium font-mono text-sm">{user.documentId || 'No registrado'}</p>
                   </div>
                </div>

                {isEditing && (
                  <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                    Para cambiar tu Cédula o Teléfono, contacta a soporte por seguridad.
                  </div>
                )}
             </div>

             {/* Google Integration Section */}
             <div className="md:col-span-2 bg-white dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 p-4 rounded-xl">
                <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  Integración Google
                </h3>
                {!user.googleProfile ? (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Conecta tu cuenta para sincronizar agenda y tareas.</p>
                    <button 
                      onClick={connectGoogle}
                      className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-3 py-1.5 rounded shadow-sm hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />
                      Conectar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-3">
                       <img src={user.googleProfile.picture} className="w-8 h-8 rounded-full" alt="Google Profile" />
                       <div>
                          <p className="text-sm font-bold text-green-700 dark:text-green-400">Conectado como {user.googleProfile.name}</p>
                          <p className="text-xs text-green-600 dark:text-green-500">{user.googleProfile.email}</p>
                       </div>
                    </div>
                    <button 
                      onClick={disconnectGoogle}
                      className="text-red-500 hover:bg-red-100 p-2 rounded-full transition-colors"
                      title="Desconectar"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                )}
             </div>

             {user.role === UserRole.DRIVER && user.driverStats && (
               <div className="md:col-span-2 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30">
                 <h3 className="font-bold text-orange-800 dark:text-orange-200 flex items-center gap-2 mb-3">
                    <Award /> Estadísticas Pana
                 </h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                       <p className="text-2xl font-bold text-gray-800 dark:text-white">{user.driverStats.rating}</p>
                       <p className="text-xs text-gray-500 flex justify-center items-center gap-1">
                          <Star size={10} className="fill-yellow-400 text-yellow-400"/> Calificación
                       </p>
                    </div>
                    <div className="text-center p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                       <p className="text-2xl font-bold text-gray-800 dark:text-white">{user.driverStats.completedRides}</p>
                       <p className="text-xs text-gray-500">Viajes</p>
                    </div>
                    <div className="col-span-2 text-center p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                       <p className="text-xl font-bold text-mipana-mediumBlue">{user.driverStats.level}</p>
                       <p className="text-xs text-gray-500">Nivel Actual</p>
                    </div>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end gap-3 animate-slide-up">
           <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
             <X size={16} className="mr-2"/> Cancelar
           </Button>
           <Button onClick={handleSave} disabled={isLoading}>
             {isLoading ? 'Guardando...' : <><Check size={16} className="mr-2"/> Guardar Cambios</>}
           </Button>
        </div>
      )}
      
      {!isEditing && (
        <div className="flex justify-end">
           <Button variant="outline" className="mr-2">Cambiar Contraseña</Button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
