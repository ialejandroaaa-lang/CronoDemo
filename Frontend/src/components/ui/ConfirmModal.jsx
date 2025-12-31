import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from './Dialog';

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", variant = "danger" }) => {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) setIsSubmitting(false);
    }, [isOpen]);

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose} className="max-w-sm">
            <DialogContent className="p-0">
                <div className="p-6">
                    <div className="flex items-center space-x-3 text-left">
                        <div className={`p-2 rounded-full flex-shrink-0 ${variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            <AlertCircle size={24} />
                        </div>
                        <DialogTitle>{title}</DialogTitle>
                    </div>

                    <div className="mt-4 text-sm text-gray-600 leading-relaxed">
                        {message}
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 gap-2 sm:gap-0 border-t border-gray-100">
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onClose}
                        className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50 transition-colors"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleConfirm}
                        className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-hd-orange hover:bg-orange-600 focus:ring-orange-500'
                            }`}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
