import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, PersonalData, TravelPreferences } from '../types';
import { Bell } from 'lucide-react';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import PersonalInfoSection from '../components/profile/PersonalInfoSection';
import PhotoUploadCard from '../components/profile/PhotoUploadCard';
import PreferencesSection from '../components/profile/PreferencesSection';
import SecuritySection from '../components/profile/security/SecuritySection';
import { passengerService } from '../services/passengerService';
import { toast } from 'sonner';

const UserProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [activeSection, setActiveSection] = useState('personal');
  const [passengerProfile, setPassengerProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPassengerProfile();
    }
  }, [user]);

  const loadPassengerProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      let profile = await passengerService.getProfile(user.id);

      // Create profile if it doesn't exist
      if (!profile) {
        profile = await passengerService.createProfile(user.id, {
          fullName: user.name,
          cedula: user.documentId || '',
        });
      }

      setPassengerProfile(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUploaded = async (photoUrl: string, thumbnailUrl: string) => {
    if (user) {
      await updateProfile({ avatarUrl: photoUrl });
      await loadPassengerProfile(); // Reload to get updated completeness
    }
  };

  const handlePersonalDataUpdate = async (data: PersonalData) => {
    if (user) {
      await updateProfile({
        name: data.fullName,
        documentId: data.cedula,
      });
      await loadPassengerProfile();
    }
  };

  const handlePreferencesUpdate = async (preferences: TravelPreferences) => {
    await loadPassengerProfile();
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Por favor, inicia sesión para ver tu perfil
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mipana-mediumBlue"></div>
          </div>
        </div>
      </div>
    );
  }

  // Render section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'personal':
        return (
          <div className="space-y-6">
            <PhotoUploadCard
              userId={user.id}
              currentPhotoUrl={user.avatarUrl}
              currentThumbnailUrl={passengerProfile?.photoProfile?.thumbnailUrl}
              onPhotoUploaded={handlePhotoUploaded}
            />
            <PersonalInfoSection
              userId={user.id}
              data={passengerProfile?.personalData || {
                fullName: user.name,
                cedula: user.documentId || '',
              }}
              onUpdate={handlePersonalDataUpdate}
            />
          </div>
        );

      case 'security':
        return <SecuritySection userId={user.id} />;

      case 'preferences':
        return (
          <PreferencesSection
            userId={user.id}
            preferences={passengerProfile?.preferences}
            onUpdate={handlePreferencesUpdate}
          />
        );

      case 'notifications':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Bell size={20} className="text-mipana-mediumBlue" />
              Notificaciones
            </h3>
            <div className="text-center py-8">
              <Bell size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Configuración de notificaciones disponible en Fase 2
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 pb-20 animate-slide-up">
      {/* Header with Avatar */}
      <div className="bg-gradient-to-r from-mipana-darkBlue to-mipana-mediumBlue rounded-2xl shadow-lg p-8 mb-6 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative flex items-center gap-6">
          <div className="relative">
            <img
              src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}&background=048ABF&color=fff`}
              alt={user.name}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white"
            />
            {passengerProfile?.photoProfile?.verified && (
              <div className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full border-2 border-white shadow-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              {user.name}
            </h1>
            <p className="text-blue-100 mb-3">
              {user.role === UserRole.PASSENGER ? '🎒 Pasajero' : user.role === UserRole.DRIVER ? '🚗 Conductor' : '👑 Administrador'}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm">
                📧 {user.email}
              </span>
              {user.phone && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm">
                  📱 {user.phone}
                </span>
              )}
            </div>
          </div>

          {/* Profile Completeness Badge */}
          {passengerProfile && (
            <div className="hidden md:block text-center">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="white"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - passengerProfile.profileCompleteness / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {passengerProfile.profileCompleteness}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-blue-100 mt-2">
                Perfil Completo
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <ProfileSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        </div>

        {/* Main Content Area */}
        <div>
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;