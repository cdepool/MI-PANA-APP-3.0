import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, DollarSign, Car, Zap, Bell, Info } from 'lucide-react';
import { LoadingSpinner } from '../../components/admin/LoadingSpinner';
import { ErrorState } from '../../components/admin/ErrorState';
import { adminService, SystemSettings } from '../../services/adminService';
import { toast } from 'sonner';

const SystemSettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<SystemSettings[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'financial' | 'service' | 'operational' | 'notifications'>('financial');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await adminService.getSystemSettings();
            setSettings(data);
        } catch (err) {
            console.error("Error loading settings", err);
            setError('Error al cargar la configuración del sistema');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateSetting = async (id: string, newValue: any) => {
        setIsSaving(true);
        try {
            const success = await adminService.updateSystemSetting(id, newValue);
            if (success) {
                toast.success('Configuración actualizada correctamente');
                // Update local state
                setSettings(prev => prev.map(s => s.id === id ? { ...s, value: newValue } : s));
            } else {
                toast.error('Error al actualizar la configuración');
            }
        } catch (err) {
            console.error("Error updating setting", err);
            toast.error('Error al actualizar la configuración');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner message="Cargando configuración del sistema..." />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={loadSettings} />;
    }

    const financialSettings = settings.filter(s => s.category === 'financial');
    const serviceSettings = settings.filter(s => s.category === 'service');
    const operationalSettings = settings.filter(s => s.category === 'operational');
    const notificationSettings = settings.filter(s => s.category === 'notifications');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Settings className="w-7 h-7 text-mipana-mediumBlue" />
                        Configuración del Sistema
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Parámetros globales de funcionamiento de MI PANA APP
                    </p>
                </div>
                <button
                    onClick={loadSettings}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                    <RefreshCw size={16} className={isSaving ? 'animate-spin' : ''} />
                    Refrescar
                </button>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-2 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-xl w-fit">
                <TabButton
                    active={activeTab === 'financial'}
                    onClick={() => setActiveTab('financial')}
                    icon={<DollarSign size={18} />}
                    label="Financiera"
                />
                <TabButton
                    active={activeTab === 'service'}
                    onClick={() => setActiveTab('service')}
                    icon={<Car size={18} />}
                    label="Servicios"
                />
                <TabButton
                    active={activeTab === 'operational'}
                    onClick={() => setActiveTab('operational')}
                    icon={<Zap size={18} />}
                    label="Operaciones"
                />
                <TabButton
                    active={activeTab === 'notifications'}
                    onClick={() => setActiveTab('notifications')}
                    icon={<Bell size={18} />}
                    label="Notificaciones"
                />
            </div>

            {/* Settings Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                {activeTab === 'financial' && (
                    <SettingsGroup
                        title="Parámetros Financieros"
                        settings={financialSettings}
                        onUpdate={handleUpdateSetting}
                        isSaving={isSaving}
                    />
                )}
                {activeTab === 'service' && (
                    <SettingsGroup
                        title="Configuración de Servicios"
                        settings={serviceSettings}
                        onUpdate={handleUpdateSetting}
                        isSaving={isSaving}
                    />
                )}
                {activeTab === 'operational' && (
                    <SettingsGroup
                        title="Parámetros Operacionales"
                        settings={operationalSettings}
                        onUpdate={handleUpdateSetting}
                        isSaving={isSaving}
                    />
                )}
                {activeTab === 'notifications' && (
                    <SettingsGroup
                        title="Configuración de Notificaciones"
                        settings={notificationSettings}
                        onUpdate={handleUpdateSetting}
                        isSaving={isSaving}
                    />
                )}

                {/* Empty state if no settings in category */}
                {settings.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        <Info className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="max-w-xs mx-auto text-sm">
                            No se han inicializado parámetros para esta categoría en la base de datos.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

interface TabButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${active
                ? 'bg-white dark:bg-gray-800 text-mipana-mediumBlue shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
    >
        {icon}
        {label}
    </button>
);

interface SettingsGroupProps {
    title: string;
    settings: SystemSettings[];
    onUpdate: (id: string, value: any) => void;
    isSaving: boolean;
}

const SettingsGroup: React.FC<SettingsGroupProps> = ({ title, settings, onUpdate, isSaving }) => (
    <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider text-xs opacity-50">
            {title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {settings.map(setting => (
                <SettingItem
                    key={setting.id}
                    setting={setting}
                    onUpdate={onUpdate}
                    isSaving={isSaving}
                />
            ))}
        </div>
    </div>
);

const SettingItem: React.FC<{
    setting: SystemSettings;
    onUpdate: (id: string, value: any) => void;
    isSaving: boolean;
}> = ({ setting, onUpdate, isSaving }) => {
    const [localValue, setLocalValue] = useState(setting.value);
    const isDirty = JSON.stringify(localValue) !== JSON.stringify(setting.value);

    const renderInput = () => {
        if (typeof setting.value === 'number') {
            return (
                <div className="relative">
                    <input
                        type="number"
                        step="0.01"
                        value={localValue}
                        onChange={(e) => setLocalValue(parseFloat(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mipana-mediumBlue focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>
            );
        }

        if (typeof setting.value === 'string') {
            return (
                <input
                    type="text"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mipana-mediumBlue focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
            );
        }

        if (typeof setting.value === 'boolean') {
            return (
                <button
                    onClick={() => setLocalValue(!localValue)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-mipana-mediumBlue focus:ring-offset-2 ${localValue ? 'bg-mipana-mediumBlue' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localValue ? 'translate-x-6' : 'translate-x-1'
                            }`}
                    />
                </button>
            );
        }

        // Default to JSON textarea for objects/arrays
        return (
            <textarea
                value={typeof localValue === 'object' ? JSON.stringify(localValue, null, 2) : localValue}
                onChange={(e) => {
                    try {
                        setLocalValue(JSON.parse(e.target.value));
                    } catch {
                        setLocalValue(e.target.value);
                    }
                }}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mipana-mediumBlue focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-xs"
            />
        );
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-start">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {setting.key.replace(/_/g, ' ').toUpperCase()}
                </label>
                {isDirty && !isSaving && (
                    <button
                        onClick={() => onUpdate(setting.id, localValue)}
                        className="text-xs font-bold text-mipana-mediumBlue hover:underline flex items-center gap-1"
                    >
                        <Save size={12} />
                        GUARDAR
                    </button>
                )}
            </div>
            <p className="text-xs text-gray-500 mb-2">
                Última actualización: {new Date(setting.updated_at).toLocaleString('es-VE')}
            </p>
            {renderInput()}
        </div>
    );
};

export default SystemSettingsPage;
