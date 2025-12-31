// Force refresh for Vite resolution
import React from 'react';
import SmartList from '../../../components/SmartList.jsx';

const SmartList_Facturas = () => {
    const columns = [
        { field: 'Numero', label: 'No. Factura', type: 'text', width: 120 },
        { field: 'Fecha', label: 'Fecha', type: 'date', width: 100 },
        { field: 'Proveedor', label: 'Proveedor', type: 'text', width: 250 },
        { field: 'Moneda', label: 'Moneda', type: 'text', width: 80 },
        { field: 'Total', label: 'Total', type: 'currency', width: 120 },
        { field: 'Saldo', label: 'Saldo Pend.', type: 'currency', width: 120 },
        { field: 'Estado', label: 'Estado', type: 'text', width: 100 },
        { field: 'Almacen', label: 'Almacén Dest.', type: 'text', width: 150 },
        { field: 'Antiguedad', label: 'Antigüedad (días)', type: 'number', width: 100 },
    ];

    return <SmartList endpoint="/SmartList/Facturas" title="SmartList: Facturas de Compra" columns={columns} />;
};

export default SmartList_Facturas;


