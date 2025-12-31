import React from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * GateKeeper Component
 * 
 * Conditionally renders or secures children based on user permissions.
 * 
 * @param {string} permission - The permission code to check (e.g., 'POS_DELETE_LINE')
 * @param {string} behavior - 'hide' (default) removes element, 'disable' renders it disabled
 * @param {React.ReactNode} children - The element to protect
 * @param {React.ReactNode} fallback - Optional element to show if denied (e.g., a lock icon or nothing)
 */
const GateKeeper = ({ permission, behavior = 'disable', children, fallback = null }) => {
    const { hasPermission } = useAuth();
    const isAllowed = hasPermission(permission);

    if (isAllowed) {
        return <>{children}</>;
    }

    if (behavior === 'hide') {
        return fallback || null;
    }

    if (behavior === 'disable') {
        // If it's a single React element, try to clone it with disabled prop
        if (React.isValidElement(children)) {
            return React.cloneElement(children, {
                disabled: true,
                title: 'No tiene permiso para realizar esta acción',
                className: `${children.props.className || ''} opacity-50 cursor-not-allowed grayscale pointer-events-none`,
                onClick: (e) => { e.preventDefault(); e.stopPropagation(); }
            });
        }

        // If it's not a valid element (e.g. text or fragment), wrap it
        return (
            <div className="opacity-50 cursor-not-allowed grayscale pointer-events-none" title="Acceso Denegado">
                {children}
            </div>
        );
    }

    return null;
};

export default GateKeeper;
