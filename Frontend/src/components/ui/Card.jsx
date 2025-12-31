import React from 'react';

export const Card = React.forwardRef(({ children, className = '', ...props }, ref) => {
    return (
        <div ref={ref} className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`} {...props}>
            {children}
        </div>
    );
});

export const CardHeader = React.forwardRef(({ children, className = '', ...props }, ref) => {
    return (
        <div ref={ref} className={`px-6 py-4 border-b border-gray-100 ${className}`} {...props}>
            {children}
        </div>
    );
});

export const CardTitle = React.forwardRef(({ children, className = '', ...props }, ref) => {
    return (
        <h3 ref={ref} className={`text-lg font-semibold text-gray-800 ${className}`} {...props}>
            {children}
        </h3>
    );
});

export const CardContent = React.forwardRef(({ children, className = '', ...props }, ref) => {
    return (
        <div ref={ref} className={`px-6 py-4 ${className}`} {...props}>
            {children}
        </div>
    );
});

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardContent.displayName = 'CardContent';
