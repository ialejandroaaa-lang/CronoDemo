// Force refresh for Vite resolution
import React from 'react';
import SmartList from '../../../components/SmartList.jsx';

const SmartList_Proveedores = () => {
    const columns = [
        { field: 'Codigo', label: 'Código', type: 'text', width: 100 },
        { field: 'Proveedor', label: 'Razón Social', type: 'text', width: 280 },
        { field: 'RNC', label: 'RNC/Cédula', type: 'text', width: 120 },
        { field: 'Total_Comprado', label: 'Total Comprado (RD$)', type: 'currency', width: 150 },
        { field: 'Saldo_Pendiente', label: 'Saldo Actual (RD$)', type: 'currency', width: 150 },
        { field: 'Cant_Facturas', label: 'Facturas', type: 'number', width: 100 },
        { field: 'Telefono', label: 'Teléfono', type: 'text', width: 120 },
        { field: 'Email', label: 'Correo Electrónico', type: 'text', width: 200 },
    ];

    return <SmartList endpoint="/SmartList/Proveedores" title="SmartList: Maestro de Proveedores y Balances" columns={columns} />;
};

export default SmartList_Proveedores;


