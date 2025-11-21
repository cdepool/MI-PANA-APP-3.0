
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { User, Mail, Star, Shield, Award, Edit2, LogOut } from 'lucide-react';
import Button from '../components/Button';

const UserProfile: React.FC = () => {
  const { user, connectGoogle, disconnectGoogle } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up pb-12">
      
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-mipana-darkBlue to-mipana-mediumBlue"></div>
        <div className="px-6 pb-6 relative">
          <div className="absolute -top-16 left-6">
            <img 
              src={user.avatarUrl} 
              alt={user.name} 
              className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-md object-cover bg-white"
            />
            <button className="absolute bottom-0 right-0 bg-mipana-orange text-white p-2 rounded-full shadow-md hover:bg-orange-600 transition-colors">
              <Edit2 size={16} />
            </button>
          </div>
          
          <div className="ml-40 pt-2">
             <h2 className="text-2xl font-bold dark:text-white">{user.name}</h2>
             <p className="text-mipana-mediumBlue font-medium flex items-center gap-1">
               {user.role === UserRole.DRIVER ? 'Conductor Certificado' : 'Pasajero'} 
               {user.role === UserRole.ADMIN && <Shield size={16} />}
             </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                   <Mail className="text-gray-400" />
                   <div>
                      <p className="text-xs text-gray-400">Correo Electrónico</p>
                      <p className="font-medium">{user.email}</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                   <User className="text-gray-400" />
                   <div>
                      <p className="text-xs text-gray-400">ID de Usuario</p>
                      <p className="font-medium font-mono text-sm">{user.id}</p>
                   </div>
                </div>
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

      <div className="flex justify-end">
         <Button variant="outline" className="mr-2">Cambiar Contraseña</Button>
         <Button>Editar Perfil</Button>
      </div>
    </div>
  );
};

export default UserProfile;
