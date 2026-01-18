import React, { useState, useEffect } from 'react';
import { ClipboardList, Filter, Calendar } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../../components/admin/DataTable';
import { LoadingSpinner } from '../../components/admin/LoadingSpinner';
import { ErrorState } from '../../components/admin/ErrorState';
import { adminService, AdminAuditLog } from '../../services/adminService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AdminAuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await adminService.getAuditLogs();
            setLogs(data);
        } catch (err) {
            console.error("Error loading audit logs", err);
            setError('Error al cargar los logs de auditoría');
        } finally {
            setIsLoading(false);
        }
    };

    const columns: ColumnDef<AdminAuditLog>[] = [
        {
            accessorKey: 'created_at',
            header: 'Fecha y Hora',
            cell: ({ row }) => (
                <span className="text-xs font-mono">
                    {format(new Date(row.original.created_at), 'dd/MM/yyyy HH:mm:ss')}
                </span>
            ),
        },
        {
            accessorKey: 'admin_name',
            header: 'Administrador',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium">{row.original.admin_name}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{row.original.admin_id.slice(0, 8)}...</span>
                </div>
            ),
        },
        {
            accessorKey: 'action_type',
            header: 'Acción',
            cell: ({ row }) => <ActionBadge action={row.original.action_type} />,
        },
        {
            accessorKey: 'resource_type',
            header: 'Recurso',
            cell: ({ row }) => (
                <span className="text-xs font-medium uppercase text-gray-500">
                    {row.original.resource_type}
                </span>
            ),
        },
        {
            accessorKey: 'resource_id',
            header: 'ID Recurso',
            cell: ({ row }) => (
                <span className="text-[10px] font-mono text-gray-400">
                    {row.original.resource_id}
                </span>
            ),
        },
        {
            accessorKey: 'details',
            header: 'Detalles',
            cell: ({ row }) => (
                <details className="cursor-pointer">
                    <summary className="text-xs text-mipana-mediumBlue hover:underline">Ver JSON</summary>
                    <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-[10px] font-mono overflow-auto max-w-xs">
                        {JSON.stringify(row.original.details, null, 2)}
                    </pre>
                </details>
            ),
        },
    ];

    if (isLoading) {
        return <LoadingSpinner message="Cargando logs de auditoría..." />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={loadLogs} />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClipboardList className="w-7 h-7 text-mipana-mediumBlue" />
                        Logs de Auditoría
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Registro histórico de todas las acciones administrativas
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Date Range Picker or other filters could go here */}
                </div>
            </div>

            {/* Logs Table */}
            <DataTable
                columns={columns}
                data={logs}
                searchKey="admin_name"
                enableExport={true}
            />
        </div>
    );
};

const ActionBadge = ({ action }: { action: string }) => {
    const getStyle = (act: string) => {
        if (act.includes('create')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        if (act.includes('update')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        if (act.includes('delete') || act.includes('suspend')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    };

    return (
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStyle(action)}`}>
            {action.replace(/_/g, ' ')}
        </span>
    );
};

export default AuditLogs;
