import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, FileCheck, XCircle, Clock, CheckCircle, Keyboard } from 'lucide-react';
import { driverService } from '../services/driverService';
import { AuditChange } from '../types';
import Button from '../components/Button';
import { currentBcvRate } from '../services/pricingService';
import { ApprovalCardSkeleton } from '../components/SkeletonLoader';
import { useKeyboardShortcuts, useEscape } from '../hooks/useKeyboardShortcuts';
import { useOptimisticUpdate } from '../hooks/useOptimisticUpdate';
import { toast } from 'sonner';

// Admin view to review and approve/reject driver profile changes
const AdminApprovalDashboard: React.FC = () => {
    const { user } = useAuth();
    const [pendingChanges, setPendingChanges] = useState<AuditChange[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedChange, setSelectedChange] = useState<AuditChange | null>(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(0);

    // Load all pending changes from all drivers
    React.useEffect(() => {
        loadAllPendingChanges();
    }, []);

    const loadAllPendingChanges = async () => {
        setLoading(true);
        try {
            const allChanges: AuditChange[] = [];
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

    // ============================================
    // OPTIMISTIC UI FOR APPROVALS
    // ============================================

    const { execute: executeApproval } = useOptimisticUpdate({
        onOptimistic: (change: AuditChange & { driverId?: string }) => {
            // Remove from pending list immediately
            setPendingChanges(prev => prev.filter(c => c.id !== change.id));
        },
        onExecute: async (change: AuditChange & { driverId?: string }) => {
            if (!change.driverId) throw new Error('No driver ID');

            const profileKey = `driver_profile_${change.driverId}`;
            const profile = JSON.parse(localStorage.getItem(profileKey) || '{}');

            profile.auditLog = profile.auditLog.map((c: AuditChange) =>
                c.id === change.id ? { ...c, status: 'APPROVED', reviewedAt: new Date(), reviewedBy: user?.id } : c
            );

            if (change.field && change.newValue) {
                (profile as any)[change.field] = change.newValue;
            }

            profile.pendingChanges = profile.pendingChanges?.filter((c: AuditChange) => c.id !== change.id) || [];
            localStorage.setItem(profileKey, JSON.stringify(profile));
        },
        onSuccess: (_, change) => {
            toast.success('Cambio aprobado', {
                description: `Cambio de ${getFieldLabel(change.field)} aprobado para ${change.driverName}`,
                duration: 3000
            });
        },
        onError: (error, change) => {
            toast.error('Error al aprobar', {
                description: 'El cambio ha sido revertido'
            });
        },
        onRollback: (change) => {
            // Re-add to pending list
            setPendingChanges(prev => [...prev, change]);
        }
    });

    const { execute: executeRejection } = useOptimisticUpdate({
        onOptimistic: (data: { change: AuditChange & { driverId?: string }, reason: string }) => {
            setPendingChanges(prev => prev.filter(c => c.id !== data.change.id));
        },
        onExecute: async (data: { change: AuditChange & { driverId?: string }, reason: string }) => {
            const { change, reason } = data;
            if (!change.driverId) throw new Error('No driver ID');

            const profileKey = `driver_profile_${change.driverId}`;
            const profile = JSON.parse(localStorage.getItem(profileKey) || '{}');

            profile.auditLog = profile.auditLog.map((c: AuditChange) =>
                c.id === change.id ? { ...c, status: 'REJECTED', rejectionReason: reason, reviewedAt: new Date(), reviewedBy: user?.id } : c
            );

            profile.pendingChanges = profile.pendingChanges?.filter((c: AuditChange) => c.id !== change.id) || [];
            localStorage.setItem(profileKey, JSON.stringify(profile));
        },
        onSuccess: (_, data) => {
            toast.success('Cambio rechazado', {
                description: `Motivo: ${data.reason}`
            });
        },
        onError: () => {
            toast.error('Error al rechazar', {
                description: 'El cambio ha sido revertido'
            });
        },
        onRollback: (data) => {
            setPendingChanges(prev => [...prev, data.change]);
        }
    });

    const handleApprove = (change: AuditChange & { driverId?: string }) => {
        executeApproval(change);
    };

    const handleReject = (change: AuditChange & { driverId?: string }, reason: string) => {
        executeRejection({ change, reason });
        setRejectModalOpen(false);
        setRejectReason('');
    };

    const openRejectModal = (change: AuditChange) => {
        setSelectedChange(change);
        setRejectModalOpen(true);
    };

    // ============================================
    // KEYBOARD SHORTCUTS
    // ============================================

    useKeyboardShortcuts({
        'a': () => {
            if (pendingChanges.length > 0 && !rejectModalOpen) {
                handleApprove(pendingChanges[focusedIndex] as any);
            }
        },
        'r': () => {
            if (pendingChanges.length > 0 && !rejectModalOpen) {
                openRejectModal(pendingChanges[focusedIndex]);
            }
        },
        'ArrowDown': () => {
            if (!rejectModalOpen) {
                setFocusedIndex(prev => Math.min(prev + 1, pendingChanges.length - 1));
            }
        },
        'ArrowUp': () => {
            if (!rejectModalOpen) {
                setFocusedIndex(prev => Math.max(prev - 1, 0));
            }
        }
    });

    useEscape(() => {
        if (rejectModalOpen) {
            setRejectModalOpen(false);
            setRejectReason('');
        }
    }, rejectModalOpen);

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
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileCheck size={32} className="text-blue-600" />
                            Panel de Aprobaciones
                        </h1>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <Keyboard size={14} />
                            Atajos: <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">A</kbd> Aprobar
                            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">R</kbd> Rechazar
                            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">↑↓</kbd> Navegar
                        </p>
                    </div>
                    <div className="bg-blue-100 px-4 py-2 rounded-lg">
                        <span className="text-2xl font-bold text-blue-900">{pendingChanges.length}</span>
                        <span className="text-sm text-blue-700 ml-2">pendientes</span>
                    </div>
                </div>

                {/* ============================================ */}
                {/* SKELETON LOADER */}
                {/* ============================================ */}
                {loading && <ApprovalCardSkeleton count={3} />}

                {!loading && pendingChanges.length === 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center animate-fade-in-up">
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
                    {pendingChanges.map((change: any, index) => (
                        <div
                            key={change.id}
                            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 transition-all duration-200 animate-fade-in-up ${index === focusedIndex ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
                                }`}
                            style={{ animationDelay: `${index * 50}ms` }}
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
                                        {index === focusedIndex && (
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                                                Seleccionado
                                            </span>
                                        )}
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
                                        className="bg-green-600 hover:bg-green-700 text-white transition-all duration-200 hover:scale-105 active:scale-95"
                                    >
                                        <CheckCircle size={16} className="mr-1" />
                                        Aprobar
                                        <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-green-700 rounded">A</kbd>
                                    </Button>
                                    <Button
                                        onClick={() => openRejectModal(change)}
                                        disabled={loading}
                                        variant="outline"
                                        className="border-red-500 text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale-105 active:scale-95"
                                    >
                                        <XCircle size={16} className="mr-1" />
                                        Rechazar
                                        <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">R</kbd>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ============================================ */}
            {/* REJECT MODAL */}
            {/* ============================================ */}
            {rejectModalOpen && selectedChange && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 animate-fade-in-up">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Rechazar Cambio
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Proporciona una razón para rechazar este cambio:
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
                            rows={4}
                            placeholder="Ej: Información incorrecta, documentos faltantes..."
                            autoFocus
                        />
                        <div className="flex gap-2 mt-4">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setRejectModalOpen(false);
                                    setRejectReason('');
                                }}
                                className="flex-1"
                            >
                                Cancelar
                                <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 rounded">Esc</kbd>
                            </Button>
                            <Button
                                onClick={() => handleReject(selectedChange as any, rejectReason)}
                                disabled={!rejectReason.trim()}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                                Confirmar Rechazo
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminApprovalDashboard;
