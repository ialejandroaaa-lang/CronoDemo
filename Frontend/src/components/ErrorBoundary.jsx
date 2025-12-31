import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render shows fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error('ErrorBoundary caught an error', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="p-6 bg-red-100 text-red-800 rounded-md">
                    <h2 className="text-lg font-semibold mb-2">Algo salió mal</h2>
                    <p>Por favor, recargue la página o contacte al soporte.</p>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <pre className="mt-4 text-sm whitespace-pre-wrap">
                            {this.state.error.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
