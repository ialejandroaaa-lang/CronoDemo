// SmartList para Cobros de Ventas
import React from 'react';
import SmartList from '../../../components/SmartList.jsx';

const SmartList_Cobros = () => {
    const columns = [
        { field: 'Fecha', label: 'Fecha', type: 'date', width: 110 },
        { field: 'No_Factura', label: 'No. Factura', type: 'text', width: 130 },
        { field: 'Cliente', label: 'Cliente', type: 'text', width: 200 },
        { field: 'NCF', label: 'NCF', type: 'text', width: 140 },
        { field: 'Metodo_Pago', label: 'Método de Pago', type: 'text', width: 130 },
        { field: 'Monto_Recibido', label: 'Monto Recibido', type: 'currency', width: 130 },
        { field: 'Cambio', label: 'Cambio', type: 'currency', width: 100 },
        { field: 'Total', label: 'Total', type: 'currency', width: 120 },
        { field: 'Estado', label: 'Estado', type: 'text', width: 100 },
    ];

    return <SmartList endpoint="/SmartList/Cobros" title="SmartList: Cobros y Métodos de Pago" columns={columns} />;
};

export default SmartList_Cobros;

