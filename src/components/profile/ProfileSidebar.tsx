import React from 'react';
import {
    User,
    Shield,
    Settings,
    MapPin,
    CreditCard,
    Bell,
    ChevronRight,
    Star
} from 'lucide-react';

export interface MenuSection {
    id: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    subsections?: {
        id: string;
        label: string;
    }[];
}

interface ProfileSidebarProps {
    activeSection: string;
    onSectionChange: (sectionId: string) => void;
    className?: string;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
    activeSection,
    onSectionChange,
    className = '',
}) => {
    const sections: MenuSection[] = [
        {
            id: 'personal',
            label: 'Información Personal',
            icon: <User size={20} />,
        },
        {
            id: 'security',
            label: 'Seguridad',
            icon: <Shield size={20} />,
            badge: 0,
        },
        {
            id: 'preferences',
            label: 'Preferencias de Viaje',
            icon: <Star size={20} />,
        },
        {
            id: 'notifications',
            label: 'Notificaciones',
            icon: <Bell size={20} />,
        },
    ];

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 ${className}`}>
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white px-2">
                    Mi Perfil
                </h2>
                <p className="text-sm text-gray-500 px-2 mt-1">
                    Gestiona tu información
                </p>
            </div>

            <nav className="space-y-1">
                {sections.map((section) => {
                    const isActive = activeSection === section.id;

                    return (
                        <button
                            key={section.id}
                            onClick={() => onSectionChange(section.id)}
                            className={`
                w-full flex items-center justify-between
                px-4 py-3 rounded-xl
                transition-all duration-200
                ${isActive
                                    ? 'bg-mipana-darkBlue text-white shadow-md'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }
              `}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`${isActive ? 'text-white' : 'text-mipana-mediumBlue'}`}>
                                    {section.icon}
                                </div>
                                <span className="font-medium text-sm">
                                    {section.label}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                {section.badge !== undefined && section.badge > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {section.badge}
                                    </span>
                                )}
                                <ChevronRight
                                    size={16}
                                    className={isActive ? 'text-white' : 'text-gray-400'}
                                />
                            </div>
                        </button>
                    );
                })}
            </nav>

            {/* Profile Completeness */}
            <div className="mt-8 px-2">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Perfil Completo
                    </span>
                    <span className="text-xs font-bold text-mipana-mediumBlue">
                        75%
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-mipana-darkBlue to-mipana-mediumBlue h-2 rounded-full transition-all duration-500"
                        style={{ width: '75%' }}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Completa tu perfil para obtener mejores recomendaciones
                </p>
            </div>
        </div>
    );
};

export default ProfileSidebar;
