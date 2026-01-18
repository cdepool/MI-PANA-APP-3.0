import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, Trash2, X } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/admin/DataTable';
import { LoadingSpinner } from '../../components/admin/LoadingSpinner';
import { ErrorState } from '../../components/admin/ErrorState';
import { userManagementService, UserProfile } from '../../services/adminService';
import { AdminRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const TeamManagement: React.FC = () => {
    const { user } = useAuth();
    const [admins, setAdmins] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Check if user is super admin
    const isSuperAdmin = user?.adminRole === AdminRole.SUPER_ADMIN;

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await userManagementService.getAdmins();
            setAdmins(data);
        } catch (err) {
            console.error("Error loading admins", err);
            setError('Error al cargar el equipo administrativo');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuspendUser = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        const action = newStatus === 'suspended' ? 'suspender' : 'activar';

        if (!confirm(`¿Estás seguro de ${action} este administrador?`)) {
            return;
        }

        try {
            const success = await userManagementService.updateUserStatus(userId, newStatus);
            if (success) {
                toast.success(`Administrador ${newStatus === 'suspended' ? 'suspendido' : 'activado'} exitosamente`);
                loadAdmins();
            } else {
                toast.error('Error al actualizar el estado del administrador');
            }
        } catch (err) {
            console.error("Error updating user status", err);
            toast.error('Error al actualizar el estado del administrador');
        }
    };

    const columns: ColumnDef<UserProfile>[] = [
        {
            accessorKey: 'name',
            header: 'Administrador',
            cell: ({ row }) => (
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                        {row.original.name}
                    </div>
                    <div className="text-xs text-gray-500">{row.original.email}</div>
                </div>
            ),
        },
        {
            accessorKey: 'adminRole',
            header: 'Rol',
            cell: ({ row }) => (
                <RoleBadge role={(row.original as any).adminRole || 'ADMIN'} />
            ),
        },
        {
            accessorKey: 'status',
            header: 'Estado',
            cell: ({ row }) => (
                <StatusBadge status={row.original.status} />
            ),
        },
        {
            accessorKey: 'createdAt',
            header: 'Fecha de Registro',
            cell: ({ row }) => (
                <span className="text-gray-500">
                    {new Date(row.original.createdAt).toLocaleDateString('es-VE')}
                </span>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Acciones</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => handleSuspendUser(row.original.id, row.original.status)}
                        className={`p-2 rounded-lg transition-colors ${row.original.status === 'active'
                            ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                            : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }`}
                        title={row.original.status === 'active' ? 'Suspender' : 'Activar'}
                    >
                        <Shield size={18} />
                    </button>
                    <button
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar"
                        onClick={() => toast.info('Funcionalidad en desarrollo')}
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ),
        },
    ];

    if (isLoading) {
        return <LoadingSpinner message="Cargando equipo administrativo..." />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={loadAdmins} />;
    }

    if (!isSuperAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Acceso Restringido
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Solo los Super Administradores pueden gestionar el equipo
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="w-7 h-7 text-mipana-mediumBlue" />
                        Gestión de Equipo
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Administra los usuarios con acceso administrativo
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-mipana-mediumBlue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-md"
                >
                    <Plus size={20} />
                    Crear Administrador
                </button>
            </div>

            {/* Admins Table */}
            <DataTable
                columns={columns}
                data={admins}
                searchKey="name"
                enableExport={true}
            />

            {/* Create Admin Modal */}
            {isCreateModalOpen && (
                <CreateAdminModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        loadAdmins();
                    }}
                />
            )}
        </div>
    );
};

// Role Badge Component
const RoleBadge = ({ role }: { role: string }) => {
    const config: Record<string, { label: string; className: string }> = {
        SUPER_ADMIN: {
            label: 'Super Admin',
            className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        },
        ADMIN: {
            label: 'Administrador',
            className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        },
    };

    const { label, className } = config[role] || config.ADMIN;

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
            {label}
        </span>
    );
};

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { label: string; className: string }> = {
        active: {
            label: 'Activo',
            className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        },
        suspended: {
            label: 'Suspendido',
            className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        },
        pending: {
            label: 'Pendiente',
            className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        },
    };

    const { label, className } = config[status] || config.pending;

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${className}`}>
            {label}
        </span>
    );
};

// Create Admin Modal Component
const CreateAdminModal = ({
    onClose,
    onSuccess,
}: {
    onClose: () => void;
    onSuccess: () => void;
}) => {
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        role: 'ADMIN',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // TODO: Implement admin creation via Supabase
        toast.info('Funcionalidad de creación en desarrollo');
        onSuccess();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-2xl">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white">
                        Crear Nuevo Administrador
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nombre Completo
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mipana-mediumBlue focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Juan Pérez"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mipana-mediumBlue focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="admin@mipana.app"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Rol Administrativo
                        </label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-mipana-mediumBlue focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                            <option value="ADMIN">Administrador</option>
                            <option value="SUPER_ADMIN">Super Administrador</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-mipana-mediumBlue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                        >
                            Crear Administrador
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeamManagement;
