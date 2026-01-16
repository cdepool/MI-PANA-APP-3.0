import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    isChunkLoadError: boolean;
}

/**
 * Checks if the error is related to dynamic chunk loading failure
 * This commonly happens after deployments when cached JavaScript references
 * outdated chunk files that no longer exist
 */
function isChunkLoadError(error: Error): boolean {
    const errorMessage = error.message || error.toString();
    return (
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('Loading CSS chunk') ||
        errorMessage.includes('ChunkLoadError') ||
        errorMessage.includes('Failed to load')
    );
}

export class SimpleErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        isChunkLoadError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        const chunkError = isChunkLoadError(error);
        return {
            hasError: true,
            error,
            isChunkLoadError: chunkError
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);

        // If it's a chunk load error, attempt auto-reload once
        if (isChunkLoadError(error)) {
            const hasReloaded = sessionStorage.getItem('chunk_error_reload');

            if (!hasReloaded) {
                sessionStorage.setItem('chunk_error_reload', 'true');
                console.log('Chunk load error detected, reloading page...');
                // Small delay to allow the error to be logged
                setTimeout(() => {
                    window.location.reload();
                }, 100);
            } else {
                // Clear the flag for the next session
                sessionStorage.removeItem('chunk_error_reload');
            }
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full">
                        <h1 className="text-red-600 text-xl font-bold mb-4">¡Algo salió mal!</h1>

                        {this.state.isChunkLoadError ? (
                            <>
                                <p className="text-gray-700 mb-4">
                                    Se detectó una actualización de la aplicación.
                                    Por favor, recarga la página para obtener la última versión.
                                </p>
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-6">
                                    <p className="text-sm text-blue-700">
                                        💡 Esto ocurre cuando hay una nueva versión de la app y tu navegador
                                        tiene archivos en caché de la versión anterior.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-700 mb-4">
                                    Se ha producido un error inesperado en el Dashboard.
                                </p>
                                <div className="bg-gray-100 p-4 rounded overflow-auto mb-6">
                                    <code className="text-sm text-red-500 whitespace-pre-wrap">
                                        {this.state.error?.toString()}
                                    </code>
                                </div>
                            </>
                        )}

                        <button
                            onClick={() => {
                                // Clear any cached reload flags
                                sessionStorage.removeItem('chunk_error_reload');
                                // Force a hard reload to bypass cache
                                window.location.href = window.location.href;
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                        >
                            {this.state.isChunkLoadError ? 'Actualizar Aplicación' : 'Recargar Página'}
                        </button>

                        {this.state.isChunkLoadError && (
                            <button
                                onClick={() => {
                                    // Clear all caches and reload
                                    if ('caches' in window) {
                                        caches.keys().then(names => {
                                            names.forEach(name => caches.delete(name));
                                        });
                                    }
                                    sessionStorage.removeItem('chunk_error_reload');
                                    window.location.reload();
                                }}
                                className="w-full mt-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded transition-colors text-sm"
                            >
                                Limpiar caché y recargar
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
