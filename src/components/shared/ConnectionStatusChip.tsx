import { useConnectionStatus } from '../../lib/options/connection-status';

export function ConnectionStatusChip() {
    const { status, networkText } = useConnectionStatus();

    if (status === 'online') return null;

    const colors = {
        offline: 'bg-red-500',
        slow: 'bg-yellow-500',
        online: 'bg-green-500' // Fail-safe
    };

    return (
        <div className={`fixed top-0 left-0 right-0 z-50 flex justify-center`}>
            <div className={`${colors[status]} text-white text-xs font-medium px-3 py-1 rounded-b-lg shadow-sm transition-transform duration-300 transform translate-y-0`}>
                {networkText}
            </div>
        </div>
    );
}
