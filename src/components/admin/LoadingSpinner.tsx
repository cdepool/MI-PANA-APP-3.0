import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    message?: string;
    fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    message = 'Cargando...',
    fullScreen = true
}) => {
    const containerClass = fullScreen
        ? 'flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900'
        : 'flex items-center justify-center p-12';

    return (
        <div className={containerClass}>
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-mipana-mediumBlue animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
