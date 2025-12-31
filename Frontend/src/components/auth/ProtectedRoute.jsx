import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute protects top-level routes.
 * @param {string} permission - Optional permission code needed to access this page.
 */
const ProtectedRoute = ({ permission }) => {
    const { user, loading, hasPermission } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-hd-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hd-orange"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (permission && !hasPermission(permission)) {
        return <Navigate to="/" replace />; // Or to an Unauthorized page
    }

    return <Outlet />;
};

export default ProtectedRoute;

