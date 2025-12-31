// Force refresh for Vite resolution
import React from 'react';
import SmartList from '../../../components/SmartList.jsx';

const SmartList_Articulos = () => {
    const columns = [
        { field: 'Fecha', label: 'Fecha', type: 'date', width: 100 },
        { field: 'Factura', label: 'No. Factura', type: 'text', width: 120 },
        { field: 'Proveedor', label: 'Proveedor', type: 'text', width: 220 },
        { field: 'Cod_Articulo', label: 'Código', type: 'text', width: 100 },
        { field: 'Articulo', label: 'Descripción Artículo', type: 'text', width: 300 },
        { field: 'Cantidad', label: 'Cant.', type: 'number', width: 80 },
        { field: 'Unidad', label: 'UM', type: 'text', width: 60 },
        { field: 'Costo', label: 'Costo Unit.', type: 'currency', width: 110 },
        { field: 'Total_Linea', label: 'Total Línea', type: 'currency', width: 130 },
        { field: 'Almacen', label: 'Almacén', type: 'text', width: 140 },
    ];

    return <SmartList endpoint="/SmartList/Articulos" title="SmartList: Detalle de Compras por Artículo" columns={columns} />;
};

export default SmartList_Articulos;


