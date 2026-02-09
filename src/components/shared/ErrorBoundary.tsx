import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    serviceName?: string;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`Uncaught error in ${this.props.serviceName || 'component'}:`, error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                    <h3 className="text-red-700 font-medium mb-2">Algo salió mal</h3>
                    <p className="text-red-600 text-sm mb-3">
                        No pudimos cargar {this.props.serviceName || 'esta sección'}.
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
