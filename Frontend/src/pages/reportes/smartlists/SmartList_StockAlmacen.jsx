// Force refresh for Vite resolution
import React from 'react';
import SmartList from '../../../components/SmartList.jsx';

const SmartList_StockAlmacen = () => {
    const columns = [
        { field: 'Almacen', label: 'Ubicación / Almacén', type: 'text', width: 200 },
        { field: 'Codigo', label: 'Código Art.', type: 'text', width: 120 },
        { field: 'Articulo', label: 'Descripción del Artículo', type: 'text', width: 350 },
        { field: 'Unidad', label: 'Unidad', type: 'text', width: 80 },
        { field: 'Stock_Total', label: 'Existencia', type: 'number', width: 100 },
        { field: 'Costo_Ultimo', label: 'Costo Unit.', type: 'currency', width: 120 },
        { field: 'Valor_Inventario', label: 'Valor Total', type: 'currency', width: 140 },
    ];

    return <SmartList endpoint="/SmartList/StockAlmacen" title="SmartList: Inventario y Valoración por Almacén" columns={columns} />;
};

export default SmartList_StockAlmacen;

