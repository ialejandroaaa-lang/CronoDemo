import { getDefaultTemplate } from '../../api/receiptTemplates';
import React from 'react';
import { createRoot } from 'react-dom/client';
import ReceiptRenderer from './ReceiptRenderer';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

export const printReceipt = async (data) => {
    try {
        // 1. Obtener plantilla por defecto (o usar una de respaldo)
        let template;
        try {
            // Determinar tipo de recibo basado en los datos, por defecto 'Venta'
            const tipoRecibo = data.tipoRecibo || 'Venta';
            template = await getDefaultTemplate(tipoRecibo);
        } catch (e) {
            console.warn('No se encontró plantilla por defecto, usando respaldo', e);
            // Plantilla de respaldo si falla la BD
            template = {
                config: {
                    width: 80,
                    sections: [
                        { id: 'h', visible: true, order: 1, fields: [{ type: 'text', text: 'RECIBO DE VENTA (RESPALDO)', alignment: 'center', bold: true }] },
                        { id: 'i', visible: true, order: 2, fields: [{ type: 'text', source: 'receipt.total', label: 'Total:', format: 'currency', alignment: 'right', fontSize: 14 }] }
                    ]
                }
            };
        }

        // 2. Analizar configuración para detectar bindings externos (Vistas SQL)
        let externalData = {};
        const config = typeof template.configuracionJSON === 'string'
            ? JSON.parse(template.configuracionJSON)
            : template.configuracionJSON || template.config;

        if (config && config.sections) {
            // Buscar secciones que requieran datos externos
            const boundSections = config.sections.filter(s => s.viewBinding && s.viewBinding.viewName);

            for (const section of boundSections) {
                const { viewName, mappingField } = section.viewBinding;
                // Obtener el valor del campo de mapeo desde los datos actuales (e.g. data.receipt.NumeroFactura)
                const filterValue = mappingField.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : null, data);

                if (filterValue) {
                    try {
                        // Asumimos que el filtro siempre es por el campo primario o el especificado en el backend, 
                        // pero aquí pasamos el valor. El backend espera filterField y filterValue.
                        // Para simplificar, asumiremos que el backend sabe qué campo filtrar o lo enviamos si es configurable.
                        // Por ahora, usaremos 'DocumentNumber' o similar como convención, o lo inferimos.
                        // Revisando SqlMetadataController, acepta filterField.
                        // Asumiremos que el mappingField del lado de BD es igual al nombre de columna clave.
                        // Por defecto usaremos 'Numero' o 'Id' si no está especificado, o mejor, que la UI lo guarde.
                        // Como NO lo tenemos en la UI aún, usaremos 'Numero' por defecto para ventas.

                        const dbField = 'Numero'; // Ajustar según necesidad o hacer configurable

                        const res = await fetch(`${API_BASE}/SqlMetadata/Execute/${viewName}?filterField=${dbField}&filterValue=${filterValue}`);
                        if (res.ok) {
                            const viewData = await res.json();
                            if (viewData) {
                                // Normalizar keys a minúsculas para facilitar acceso
                                const normalized = {};
                                Object.keys(viewData).forEach(k => normalized[k] = viewData[k]);
                                Object.keys(viewData).forEach(k => normalized[k.toLowerCase()] = viewData[k]);

                                externalData = { ...externalData, ...normalized };
                            }
                        }
                    } catch (err) {
                        console.error(`Error cargando datos externos para vista ${viewName}:`, err);
                    }
                }
            }
        }

        // 3. Preparar datos completos
        const completeData = {
            ...data,
            ext: externalData, // Datos externos disponibles en 'ext'
            company: data.company || {
                name: 'POS CRONO',
                address: 'Calle Principal #1',
                rnc: '123456789',
                phone: '809-555-5555'
            }
        };

        // 4. Crear un iframe oculto para imprimir
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '350px';
        iframe.style.height = '800px';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;

        // 5. Renderizar el recibo en el iframe
        doc.open();
        doc.write(`
            <html>
            <head>
                <style>
                    body { margin: 0; padding: 0; font-family: monospace; }
                    @media print {
                        @page { margin: 0; size: auto; }
                        body { margin: 0; }
                    }
                    .receipt-container { margin: 0 !important; border: none !important; box-shadow: none !important; }
                </style>
            </head>
            <body>
                <div id="root"></div>
            </body>
            </html>
        `);
        doc.close();

        // 6. Montar el componente React en el iframe
        const root = createRoot(doc.getElementById('root'));
        root.render(<ReceiptRenderer template={{ ...template, config }} data={completeData} />);

        // 7. Esperar a que se renderice e imprimir
        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();

            // Limpiar después de imprimir
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);

    } catch (error) {
        console.error('Error al imprimir recibo:', error);
        alert('Error al imprimir recibo: Verifique la consola para más detalles.');
    }
};
