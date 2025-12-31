import React from 'react';
import { X } from 'lucide-react';

const Dialog = ({ open, onOpenChange, children, className = "max-w-3xl" }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => onOpenChange(false)}
            />
            {/* Modal */}
            <div className={`relative z-[101] w-full bg-white rounded-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden ${className}`}>
                {children}
            </div>
        </div>
    );
};

const DialogContent = ({ children, className = "" }) => (
    <div className={`p-6 ${className}`}>
        {children}
    </div>
);

const DialogHeader = ({ children, className = "" }) => (
    <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}>
        {children}
    </div>
);

const DialogTitle = ({ children, className = "" }) => (
    <h2 className={`text-lg font-semibold leading-none tracking-tight text-gray-900 ${className}`}>
        {children}
    </h2>
);

const DialogFooter = ({ children, className = "" }) => (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 ${className}`}>
        {children}
    </div>
);

const DialogClose = ({ onClick, children }) => (
    <button onClick={onClick} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
    </button>
);

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose };

