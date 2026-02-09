import { Suspense } from 'react';
import { UserGreeting } from '../components/home/UserGreeting';
import { UniversalSearchBar } from '../components/home/UniversalSearchBar';
import { ServicesGrid } from '../components/home/ServicesGrid';
import { ConnectionStatusChip } from '../components/shared/ConnectionStatusChip';
import { ErrorBoundary } from '../components/shared/ErrorBoundary';

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <ConnectionStatusChip />

            <main className="max-w-md mx-auto pt-4 safe-top">
                <UserGreeting />

                <div className="mt-2">
                    <UniversalSearchBar />
                </div>

                <ErrorBoundary serviceName="Services">
                    <ServicesGrid />
                </ErrorBoundary>

                {/* Recent Activity Section - Placeholder for future implementation */}
                <div className="mt-6 px-4">
                    <h2 className="text-sm font-semibold text-gray-900 mb-3">Actividad reciente</h2>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-center h-24 text-gray-400 text-sm">
                        Tus viajes y pedidos aparecerán aquí
                    </div>
                </div>
            </main>
        </div>
    );
}
