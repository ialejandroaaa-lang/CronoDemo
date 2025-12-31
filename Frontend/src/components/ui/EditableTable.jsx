import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from './Button';

export const EditableTableCell = ({ value, onChange, type = 'text', className = '' }) => {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
            className={`w-full px-2 py-1 text-sm border-0 bg-transparent focus:bg-white focus:ring-1 focus:ring-hd-orange rounded ${className}`}
            step={type === 'number' ? '0.01' : undefined}
        />
    );
};

export const DeleteButton = ({ onClick }) => {
    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    );
};


