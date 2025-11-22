import React from 'react';
import { Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { AuditChange } from '../../types';

interface PendingChangesNotificationProps {
    changes: AuditChange[];
}

export const PendingChangesNotification: React.FC<PendingChangesNotificationProps> = ({ changes }) => {
    if (!changes || changes.length === 0) return null;

    return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg shadow-sm">
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <Clock className="h-5 w-5 text-yellow-600" aria-hidden="true" />
                </div>
                <div className="ml-3 w-full">
                    <h3 className="text-sm font-medium text-yellow-800">
                        Tienes {changes.length} cambio{changes.length !== 1 ? 's' : ''} pendiente{changes.length !== 1 ? 's' : ''} de aprobación
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                        <ul className="list-disc pl-5 space-y-1">
                            {changes.map((change) => (
                                <li key={change.id}>
                                    <span className="font-semibold capitalize">{change.field.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    <span className="text-yellow-600/80 text-xs ml-2">
                                        ({new Date(change.timestamp).toLocaleDateString()})
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-yellow-600">
                            Los cambios serán revisados por un administrador en un plazo de 24-48 horas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
