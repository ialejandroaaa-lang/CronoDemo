import React from 'react';

export const Input = React.forwardRef(({
    label,
    error,
    className = '',
    id,
    ...props
}, ref) => {
    return (
        <div className={`flex flex-col space-y-1.5 ${className}`}>
            {label && (
                <label htmlFor={id} className="text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                id={id}
                className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-hd-orange focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                {...props}
                value={props.value !== undefined ? props.value : ''}
            />
            {error && (
                <span className="text-xs text-red-500">{error}</span>
            )}
        </div>
    );
});

Input.displayName = "Input";
