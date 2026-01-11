import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, FileCheck, XCircle, Clock, CheckCircle } from 'lucide-react';
import { driverService } from '../services/driverService';
import { AuditChange } from '../types';
import Button from '../components/Button';
import { currentBcvRate } from '../services/pricingService';

// Admin view to review and approve/reject driver profile changes
const AdminApprovalDashboard: React.FC = () => {
    const { user } = useAuth();
    const [pendingChanges, setPendingChanges] = useState<AuditChange[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedChange, setSelectedChange] = useState<AuditChange | null>(null);

    // Load all pending changes from all drivers
    React.useEffect(() => {
        loadAllPendingChanges();
    }, []);

    const loadAllPendingChanges = async () => {
        setLoading(true);
        try {
            // In a real app, this would fetch from backend
            // For mock, we'll get from all drivers in localStorage
            const allChanges: AuditChange[] = [];

            // Get all driver profiles from localStorage
            const keys = Object.keys(localStorage);
            for (const key of keys) {
                if (key.startsWith('driver_profile_')) {
                    const profile = JSON.parse(localStorage.getItem(key) || '{}');
                    if (profile.auditLog) {
                        const pending = profile.auditLog.filter((c: AuditChange) => c.status === 'PENDING');
                        allChanges.push(...pending.map((c: AuditChange) => ({
                            ...c,
                            driverId: key.replace('driver_profile_', ''),
                            driverName: profile.personalData?.fullName || 'Conductor'
                        })));
                    }
                }
            }

            setPendingChanges(allChanges);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (change: AuditChange & { driverId?: string }) => {
        if (!change.driverId) return;

        setLoading(true);
        try {
            const profileKey = `driver_profile_${change.driverId}`;
            const profile = JSON.parse(localStorage.getItem(profileKey) || '{}');

            // Update the audit log status
            profile.auditLog = profile.auditLog.map((c: AuditChange) =>
                c.id === change.id ? { ...c, status: 'APPROVED', reviewedAt: new Date(), reviewedBy: user?.id } : c
            );

            // Apply the changes to the actual profile
            if (change.field && change.newValue) {
                (profile as any)[change.field] = change.newValue;
            }

            // Remove from pending changes
            profile.pendingChanges = profile.pendingChanges?.filter((c: AuditChange) => c.id !== change.id) || [];

            localStorage.setItem(profileKey, JSON.stringify(profile));

            await loadAllPendingChanges();
            setSelectedChange(null);
        } catch (error) {
            alert('Error al aprobar cambio');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (change: AuditChange & { driverId?: string }, reason: string) => {
        if (!change.driverId) return;

        setLoading(true);
        try {
            const profileKey = `driver_profile_${change.driverId}`;
            const profile = JSON.parse(localStorage.getItem(profileKey) || '{}');

            // Update the audit log status
            profile.auditLog = profile.auditLog.map((c: AuditChange) =>
                c.id === change.id ? { ...c, status: 'REJECTED', rejectionReason: reason, reviewedAt: new Date(), reviewedBy: user?.id } : c
            );

            // Remove from pending changes
            profile.pendingChanges = profile.pendingChanges?.filter((c: AuditChange) => c.id !== change.id) || [];

            localStorage.setItem(profileKey, JSON.stringify(profile));

            await loadAllPendingChanges();
            setSelectedChange(null);
        } catch (error) {
            alert('Error al rechazar cambio');
        } finally {
            setLoading(false);
        }
    };

    const getFieldLabel = (field: string) => {
        const labels: Record<string, string> = {
            'fiscalData': 'Datos Fiscales',
            'bankingData': 'Datos Bancarios',
            'vehicle': 'Vehículo',
            'personalData': 'Datos Personales'
        };
        return labels[field] || field;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileCheck size={32} className="text-blue-600" />
                        Panel de Aprobaciones
                    </h1>
                    <div className="bg-blue-100 px-4 py-2 rounded-lg">
                        <span className="text-2xl font-bold text-blue-900">{pendingChanges.length}</span>
                        <span className="text-sm text-blue-700 ml-2">pendientes</span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Resumen Financiero Simulado</h2>
                        <p className="text-gray-700 dark:text-gray-300">Facturación Bruta: <span className="font-semibold">$50,000.00</span></p>
                        <p className="text-gray-700 dark:text-gray-300">Facturación Bruta (VES): <span className="font-semibold">{(50000 * (currentBcvRate || 0)).toLocaleString()}</span></p>
                        <p className="text-gray-700 dark:text-gray-300">Tasa BCV usada: <span className="font-semibold">{(currentBcvRate || 0).toFixed(2)}</span></p>
                        <p className="text-gray-700 dark:text-gray-300">Comisión Conductores (95%): <span className="font-semibold">$47,500.00</span></p>
                        <p className="text-gray-700 dark:text-gray-300">Comisión App (5%): <span className="font-semibold">$2,500.00</span></p>
                        <p className="text-gray-700 dark:text-gray-300">ISLR (3% sobre conductor): <span className="font-semibold">$1,425.00</span></p>
                        <p className="text-gray-700 dark:text-gray-300">IVA (16% sobre app): <span className="font-semibold">$400.00</span></p>
                    </div>
                </div>

                {loading && !selectedChange && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 mx-auto"></div>
                    </div>
                )}

                {!loading && pendingChanges.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
                        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            ¡Todo al día!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            No hay cambios pendientes de revisión
                        </p>
                    </div>
                )}

                <div className="grid gap-4">
                    {pendingChanges.map((change: any) => (
                        <div
                            key={change.id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                            {change.driverName}
                                        </h3>
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                                            {getFieldLabel(change.field)}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        Solicitado: {new Date(change.timestamp).toLocaleString('es-VE')}
                                    </p>

                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                                        <div>
                                            <span className="text-xs font-bold text-red-600 uppercase">Anterior:</span>
                                            <pre className="text-sm mt-1 text-gray-700 dark:text-gray-300 overflow-auto max-h-32">
                                                {JSON.stringify(change.oldValue, null, 2)}
                                            </pre>
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-green-600 uppercase">Nuevo:</span>
                                            <pre className="text-sm mt-1 text-gray-700 dark:text-gray-300 overflow-auto max-h-32">
                                                {JSON.stringify(change.newValue, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <Button
                                        onClick={() => handleApprove(change)}
                                        disabled={loading}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <CheckCircle size={16} className="mr-1" />
                                        Aprobar
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            const reason = prompt('Razón de rechazo:');
                                            if (reason) handleReject(change, reason);
                                        }}
                                        disabled={loading}
                                        variant="outline"
                                        className="border-red-500 text-red-600 hover:bg-red-50"
                                    >
                                        <XCircle size={16} className="mr-1" />
                                        Rechazar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminApprovalDashboard;
