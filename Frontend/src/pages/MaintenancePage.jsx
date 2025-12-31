import React from 'react';

const MaintenancePage = ({ title }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl">🛠️</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-700 mb-2">{title}</h2>
            <p className="max-w-md text-center">
                Estamos trabajando en el diseño de este módulo.
                Pronto verá aquí los formularios y tablas correspondientes.
            </p>
        </div>
    );
};

export default MaintenancePage;

