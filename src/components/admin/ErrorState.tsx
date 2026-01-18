import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
    title?: string;
    message: string;
    onRetry?: () => void;
    fullScreen?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
    title = 'Error al Cargar',
    message,
    onRetry,
    fullScreen = true
}) => {
    const containerClass = fullScreen
        ? 'flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4'
        : 'p-8';

    return (
        <div className={containerClass}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full border-l-4 border-red-500">
                <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="w-full px-4 py-2 bg-mipana-mediumBlue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                        Reintentar
                    </button>
                )}
            </div>
        </div>
    );
};

export default ErrorState;
