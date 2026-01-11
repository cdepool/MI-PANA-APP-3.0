import React, { useState } from 'react';
import { User, Calendar, MapPin, Save, X, Edit2 } from 'lucide-react';
import Button from '../Button';
import Input from '../Input';
import { PersonalData } from '../../types';
import { personalDataSchema, validateWithSchema } from '../../utils/validationSchemas';
import { passengerService } from '../../services/passengerService';
import { toast } from 'sonner';

interface PersonalInfoSectionProps {
    userId: string;
    data: PersonalData;
    onUpdate?: (data: PersonalData) => void;
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
    userId,
    data,
    onUpdate,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<PersonalData>(data);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    const handleInputChange = (field: keyof PersonalData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSave = async () => {
        // Validate
        const validation = validateWithSchema(personalDataSchema, formData);

        if (!validation.success && validation.errors) {
            setErrors(validation.errors);
            toast.error('Por favor corrige los errores en el formulario');
            return;
        }

        setIsSaving(true);

        try {
            await passengerService.updatePersonalData(userId, formData);
            toast.success('Información personal actualizada');
            setIsEditing(false);

            if (onUpdate) {
                onUpdate(formData);
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData(data);
        setErrors({});
        setIsEditing(false);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <User size={20} className="text-mipana-mediumBlue" />
                    Información Personal
                </h3>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-mipana-mediumBlue hover:text-mipana-darkBlue flex items-center gap-2 text-sm font-medium"
                    >
                        <Edit2 size={16} />
                        Editar
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {/* Full Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre Completo *
                    </label>
                    {isEditing ? (
                        <>
                            <Input
                                value={formData.fullName}
                                onChange={(e) => handleInputChange('fullName', e.target.value)}
                                placeholder="Ej: Juan Pérez García"
                                className={errors.fullName ? 'border-red-500' : ''}
                            />
                            {errors.fullName && (
                                <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
                            )}
                        </>
                    ) : (
                        <p className="text-gray-800 dark:text-white font-medium">
                            {data.fullName || 'No especificado'}
                        </p>
                    )}
                </div>

                {/* Cedula */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cédula de Identidad *
                    </label>
                    {isEditing ? (
                        <>
                            <Input
                                value={formData.cedula}
                                onChange={(e) => handleInputChange('cedula', e.target.value)}
                                placeholder="Ej: V-12345678"
                                className={errors.cedula ? 'border-red-500' : ''}
                            />
                            {errors.cedula && (
                                <p className="text-xs text-red-500 mt-1">{errors.cedula}</p>
                            )}
                        </>
                    ) : (
                        <p className="text-gray-800 dark:text-white font-mono">
                            {data.cedula || 'No especificado'}
                        </p>
                    )}
                </div>

                {/* Birth Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Calendar size={16} />
                        Fecha de Nacimiento
                    </label>
                    {isEditing ? (
                        <>
                            <input
                                type="date"
                                value={formData.birthDate ? formData.birthDate.toISOString().split('T')[0] : ''}
                                onChange={(e) => handleInputChange('birthDate', e.target.value ? new Date(e.target.value) : undefined)}
                                className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.birthDate ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.birthDate && (
                                <p className="text-xs text-red-500 mt-1">{errors.birthDate}</p>
                            )}
                        </>
                    ) : (
                        <p className="text-gray-800 dark:text-white">
                            {data.birthDate
                                ? data.birthDate.toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })
                                : 'No especificado'}
                        </p>
                    )}
                </div>

                {/* Gender */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Género
                    </label>
                    {isEditing ? (
                        <select
                            value={formData.gender || ''}
                            onChange={(e) => handleInputChange('gender', e.target.value || undefined)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">Seleccionar...</option>
                            <option value="MASCULINO">Masculino</option>
                            <option value="FEMENINO">Femenino</option>
                            <option value="OTRO">Otro</option>
                            <option value="PREFIERO_NO_DECIRLO">Prefiero no decirlo</option>
                        </select>
                    ) : (
                        <p className="text-gray-800 dark:text-white">
                            {data.gender || 'No especificado'}
                        </p>
                    )}
                </div>

                {/* Nationality */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nacionalidad
                    </label>
                    {isEditing ? (
                        <select
                            value={formData.nationality || ''}
                            onChange={(e) => handleInputChange('nationality', e.target.value || undefined)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">Seleccionar...</option>
                            <option value="VENEZOLANO">Venezolano</option>
                            <option value="EXTRANJERO">Extranjero</option>
                        </select>
                    ) : (
                        <p className="text-gray-800 dark:text-white">
                            {data.nationality || 'No especificado'}
                        </p>
                    )}
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <MapPin size={16} />
                        Dirección
                    </label>
                    {isEditing ? (
                        <>
                            <textarea
                                value={formData.address || ''}
                                onChange={(e) => handleInputChange('address', e.target.value || undefined)}
                                placeholder="Ej: Av. Principal, Edificio X, Piso Y, Apartamento Z"
                                rows={3}
                                className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none ${errors.address ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.address && (
                                <p className="text-xs text-red-500 mt-1">{errors.address}</p>
                            )}
                        </>
                    ) : (
                        <p className="text-gray-800 dark:text-white">
                            {data.address || 'No especificado'}
                        </p>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                        onClick={handleCancel}
                        variant="outline"
                        fullWidth
                        disabled={isSaving}
                    >
                        <X size={16} className="mr-2" />
                        Cancelar
                    </Button>
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
                                Guardar
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default PersonalInfoSection;
