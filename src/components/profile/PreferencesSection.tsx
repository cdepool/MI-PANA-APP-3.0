import React, { useState } from 'react';
import { Star, Car, Clock, UserCheck, Music, Thermometer, Save } from 'lucide-react';
import Button from '../Button';
import { TravelPreferences, VehicleType } from '../../types';
import { passengerService } from '../../services/passengerService';
import { toast } from 'sonner';

interface PreferencesSectionProps {
    userId: string;
    preferences?: TravelPreferences;
    onUpdate?: (preferences: TravelPreferences) => void;
}

const PreferencesSection: React.FC<PreferencesSectionProps> = ({
    userId,
    preferences,
    onUpdate,
}) => {
    const [formData, setFormData] = useState<TravelPreferences>(preferences || {
        requireHighRating: false,
        minDriverRating: 4.0,
        preferFemaleDriver: false,
        preferConversationalDriver: false,
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await passengerService.updatePreferences(userId, formData);
            toast.success('Preferencias actualizadas');

            if (onUpdate) {
                onUpdate(formData);
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al guardar preferencias');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Star size={20} className="text-mipana-mediumBlue" />
                Preferencias de Viaje
            </h3>

            <div className="space-y-6">
                {/* Preferred Vehicle Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Car size={16} />
                        Tipo de Vehículo Preferido
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { value: 'MOTO', label: '🏍️ Moto', description: 'Rápido' },
                            { value: 'CAR', label: '🚗 Carro', description: 'Cómodo' },
                            { value: 'FREIGHT', label: '🚚 Carga', description: 'Espacioso' },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setFormData(prev => ({ ...prev, preferredVehicleType: option.value as VehicleType }))}
                                className={`
                  p-3 rounded-xl border-2 transition-all
                  ${formData.preferredVehicleType === option.value
                                        ? 'border-mipana-mediumBlue bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}
                `}
                            >
                                <div className="text-2xl mb-1">{option.label.split(' ')[0]}</div>
                                <div className="text-xs font-medium text-gray-800 dark:text-white">
                                    {option.label.split(' ')[1]}
                                </div>
                                <div className="text-xs text-gray-500">{option.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Preferred Time */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Clock size={16} />
                        Horario Preferido
                    </label>
                    <select
                        value={formData.preferredTime || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value || undefined }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        <option value="">Sin preferencia</option>
                        <option value="morning">🌅 Mañana (6:00 AM - 12:00 PM)</option>
                        <option value="afternoon">☀️ Tarde (12:00 PM - 6:00 PM)</option>
                        <option value="evening">🌆 Noche (6:00 PM - 10:00 PM)</option>
                        <option value="night">🌙 Madrugada (10:00 PM - 6:00 AM)</option>
                    </select>
                </div>

                {/* Driver Preferences */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <UserCheck size={16} />
                        Preferencias del Conductor
                    </h4>

                    {/* High Rating Required */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Requiere Alta Calificación
                            </p>
                            <p className="text-xs text-gray-500">
                                Solo conductores con alta puntuación
                            </p>
                        </div>
                        <button
                            onClick={() => setFormData(prev => ({ ...prev, requireHighRating: !prev.requireHighRating }))}
                            className={`
                relative w-12 h-6 rounded-full transition-colors
                ${formData.requireHighRating ? 'bg-mipana-mediumBlue' : 'bg-gray-300 dark:bg-gray-600'}
              `}
                        >
                            <span
                                className={`
                  absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform
                  ${formData.requireHighRating ? 'translate-x-6' : 'translate-x-0'}
                `}
                            />
                        </button>
                    </div>

                    {/* Minimum Rating */}
                    {formData.requireHighRating && (
                        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Calificación Mínima: {formData.minDriverRating.toFixed(1)} ⭐
                            </label>
                            <input
                                type="range"
                                min="3.0"
                                max="5.0"
                                step="0.1"
                                value={formData.minDriverRating}
                                onChange={(e) => setFormData(prev => ({ ...prev, minDriverRating: parseFloat(e.target.value) }))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>3.0</span>
                                <span>5.0</span>
                            </div>
                        </div>
                    )}

                    {/* Prefer Female Driver */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Preferir Conductora Mujer
                            </p>
                            <p className="text-xs text-gray-500">
                                Cuando esté disponible
                            </p>
                        </div>
                        <button
                            onClick={() => setFormData(prev => ({ ...prev, preferFemaleDriver: !prev.preferFemaleDriver }))}
                            className={`
                relative w-12 h-6 rounded-full transition-colors
                ${formData.preferFemaleDriver ? 'bg-mipana-mediumBlue' : 'bg-gray-300 dark:bg-gray-600'}
              `}
                        >
                            <span
                                className={`
                  absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform
                  ${formData.preferFemaleDriver ? 'translate-x-6' : 'translate-x-0'}
                `}
                            />
                        </button>
                    </div>

                    {/* Prefer Conversational */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Conductor Conversador
                            </p>
                            <p className="text-xs text-gray-500">
                                Le gusta conversar durante el viaje
                            </p>
                        </div>
                        <button
                            onClick={() => setFormData(prev => ({ ...prev, preferConversationalDriver: !prev.preferConversationalDriver }))}
                            className={`
                relative w-12 h-6 rounded-full transition-colors
                ${formData.preferConversationalDriver ? 'bg-mipana-mediumBlue' : 'bg-gray-300 dark:bg-gray-600'}
              `}
                        >
                            <span
                                className={`
                  absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform
                  ${formData.preferConversationalDriver ? 'translate-x-6' : 'translate-x-0'}
                `}
                            />
                        </button>
                    </div>
                </div>

                {/* Environment Preferences */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-4">
                        Ambiente del Viaje
                    </h4>

                    {/* Music Preference */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <Music size={16} />
                            Preferencia Musical
                        </label>
                        <select
                            value={formData.musicPreference || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, musicPreference: e.target.value as any || undefined }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">Sin preferencia</option>
                            <option value="NINGUNA">🔇 Sin música</option>
                            <option value="SUAVE">🎵 Música suave</option>
                            <option value="VARIADA">🎶 Variada</option>
                            <option value="REGGAETON">🎤 Reggaeton</option>
                            <option value="SALSA">🎺 Salsa</option>
                            <option value="POP">🎸 Pop</option>
                            <option value="ROCK">🤘 Rock</option>
                        </select>
                    </div>

                    {/* Temperature Preference */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                            <Thermometer size={16} />
                            Temperatura Preferida: {formData.temperaturePreference || 22}°C
                        </label>
                        <input
                            type="range"
                            min="16"
                            max="28"
                            value={formData.temperaturePreference || 22}
                            onChange={(e) => setFormData(prev => ({ ...prev, temperaturePreference: parseInt(e.target.value) }))}
                            className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>❄️ 16°C</span>
                            <span>🔥 28°C</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-6">
                <Button
                    onClick={handleSave}
                    fullWidth
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <>Guardando...</>
                    ) : (
                        <>
                            <Save size={16} className="mr-2" />
                            Guardar Preferencias
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default PreferencesSection;
