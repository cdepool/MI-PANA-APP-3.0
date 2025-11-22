import React, { useState } from 'react';
import { Edit2, Check, X, ChevronDown, ChevronUp, AlertTriangle, Clock } from 'lucide-react';

interface ProfileSectionCardProps {
    title: string;
    icon: React.ReactNode;
    isEditing: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    loading?: boolean;
    children: React.ReactNode;
    pendingChanges?: boolean;
    status?: 'verified' | 'pending' | 'rejected' | 'none';
}

export const ProfileSectionCard: React.FC<ProfileSectionCardProps> = ({
    title,
    icon,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    loading = false,
    children,
    pendingChanges = false,
    status = 'none'
}) => {
    const [expanded, setExpanded] = useState(true);

    const getStatusColor = () => {
        switch (status) {
            case 'verified': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-white border-gray-200';
        }
    };

    return (
        <div className={`rounded-xl border shadow-sm transition-all duration-300 overflow-hidden ${getStatusColor()} mb-4`}>
            {/* Header */}
            <div
                className="p-4 flex items-center justify-between cursor-pointer bg-opacity-50"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
                        {pendingChanges && (
                            <span className="text-xs flex items-center gap-1 text-yellow-600 font-medium mt-1">
                                <Clock size={12} /> Cambios pendientes de aprobación
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {status === 'verified' && <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">Verificado</span>}
                    {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {/* Content */}
            {expanded && (
                <div className="p-4 border-t border-gray-100 bg-white">
                    <div className="mb-4">
                        {children}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-50">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={onCancel}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <X size={16} /> Cancelar
                                </button>
                                <button
                                    onClick={onSave}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? 'Guardando...' : <><Check size={16} /> Guardar Cambios</>}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onEdit}
                                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Edit2 size={16} /> Editar
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
