// Force refresh for Vite resolution
import React from 'react';
import SmartList from '../../../components/SmartList.jsx';

const SmartList_Pagos = () => {
    const columns = [
        { field: 'Fecha', label: 'Fecha Pago', type: 'date', width: 110 },
        { field: 'No_Pago', label: 'No. Recibo', type: 'text', width: 120 },
        { field: 'Proveedor', label: 'Proveedor', type: 'text', width: 250 },
        { field: 'Monto_A_Factura', label: 'Monto Aplicado', type: 'currency', width: 130 },
        { field: 'Factura_Afectada', label: 'Factura Pagada', type: 'text', width: 130 },
        { field: 'Metodo', label: 'Método', type: 'text', width: 100 },
        { field: 'Referencia', label: 'Referencia', type: 'text', width: 180 },
        { field: 'Estado_Pago', label: 'Estado', type: 'text', width: 100 },
    ];

    return <SmartList endpoint="/SmartList/Pagos" title="SmartList: Histórico de Pagos Aplicados" columns={columns} />;
};

export default SmartList_Pagos;


