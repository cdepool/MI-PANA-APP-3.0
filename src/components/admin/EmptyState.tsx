import React from 'react';
import { AlertCircle } from 'lucide-react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title?: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    message,
    action
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4">
                {icon || <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600" />}
            </div>
            {title && (
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {title}
                </h3>
            )}
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mb-6">
                {message}
            </p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-4 py-2 bg-mipana-mediumBlue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
