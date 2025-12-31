import React from 'react';

// Utilidad para formatear moneda
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
    }).format(amount);
};

// Utilidad para formatear fecha
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
};

// Utilidad para formatear hora
const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ReceiptRenderer = ({ template, data }, ref) => {
    // Si no hay plantilla o datos, no renderizar nada
    if (!template || !data) return null;

    const config = (template.config && typeof template.config === 'object')
        ? template.config
        : (typeof template.configuracionJSON === 'string' ? JSON.parse(template.configuracionJSON) : null);

    if (!config) return null;

    const width = config.width || 80; // 80mm default
    const pixelWidth = width === 80 ? '302px' : '219px'; // Approx pixels for 96dpi

    // Helper para obtener valor de nested object string (e.g. "company.name")
    const getValue = (path) => {
        if (!path) return '';
        return path.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : undefined, data);
    };

    // Helper para reemplazar placeholders en texto compuesto (e.g. "Factura: {receipt.number}")
    const formatCompositeText = (text) => {
        if (!text) return '';
        return text.replace(/\{([\w\.]+)\}/g, (match, path) => {
            const val = getValue(path);
            return val !== undefined && val !== null ? val : '';
        });
    };

    const renderField = (field, index) => {
        const style = {
            textAlign: field.alignment || 'left',
            fontSize: `${field.fontSize || 10}px`,
            fontWeight: field.bold ? 'bold' : 'normal',
            marginTop: `${field.marginTop || 0}px`,
            marginBottom: `${field.marginBottom || 0}px`,
            fontFamily: 'monospace', // Monospaced for better alignment in receipts
            whiteSpace: 'pre-wrap', // Preserve line breaks
            lineHeight: '1.2'
        };

        if (field.type === 'line') {
            const borderStyle = field.style === 'double' ? 'double' : field.style === 'dashed' ? 'dashed' : 'solid';
            const borderWidth = field.style === 'double' ? '3px' : '1px';
            return <div key={index} style={{ borderTop: `${borderWidth} ${borderStyle} black`, margin: '5px 0' }} />;
        }

        if (field.type === 'space') {
            return <div key={index} style={{ height: `${field.height || 10}px` }} />;
        }

        if (field.type === 'image' && field.source) {
            const src = getValue(field.source);
            if (!src) return null;
            return (
                <div key={index} style={{ textAlign: field.alignment || 'center', marginBottom: style.marginBottom }}>
                    <img src={src} alt="logo" style={{ maxHeight: `${field.height || 60}px`, maxWidth: '100%' }} />
                </div>
            );
        }

        if (field.type === 'table') {
            // Find items in data, could be at root or under receipt property
            const items = data.items || (data.receipt && data.receipt.items) || [];

            // Default columns if not specified
            const rawColumns = field.columns || [
                { label: 'Desc', field: 'description', width: 40, active: true },
                { label: 'Cant', field: 'quantity', width: 20, active: true },
                { label: 'Precio', field: 'price', width: 20, active: true, format: 'currency' },
                { label: 'Total', field: 'total', width: 20, active: true, format: 'currency' }
            ];

            const columns = rawColumns.filter(c => c.active !== false);

            // Default row layout only includes columns if not specified
            const rowLayout = field.rowLayout || [{ type: 'columns' }];
            const headerBorder = field.headerBorder || 'dashed';
            const borderStyle = headerBorder === 'none' ? 'none' : `1px ${headerBorder} black`;

            // Helper to process text row variables with item data
            const processItemText = (text, item) => {
                if (!text) return '';
                return text.replace(/{(\w+)}/g, (match, key) => {
                    let val = item[key];
                    if (val === undefined) return '';
                    if (typeof val === 'number' && (key === 'price' || key === 'total' || key === 'tax' || key === 'discount')) {
                        return formatCurrency(val);
                    }
                    return val;
                });
            };

            return (
                <div key={index} style={{ width: '100%', fontSize: style.fontSize, fontFamily: 'monospace', marginBottom: style.marginBottom }}>
                    {/* Header (Only for columns row type) */}
                    <div style={{ display: 'flex', borderBottom: borderStyle, paddingBottom: '2px', marginBottom: '2px', fontWeight: 'bold' }}>
                        {columns.map((col, i) => (
                            <div key={i} style={{
                                width: `${col.width}%`,
                                textAlign: col.alignment || 'left',
                                fontSize: col.fontSize ? `${col.fontSize}px` : 'inherit',
                                fontWeight: col.bold ? 'bold' : 'inherit'
                            }}>
                                {col.label}
                            </div>
                        ))}
                    </div>
                    {/* Items */}
                    {items.map((item, itemIdx) => (
                        <div key={itemIdx} style={{ marginBottom: '4px', borderBottom: '1px dotted #eee' }}>
                            {rowLayout.map((row, rowIdx) => {
                                if (row.type === 'columns') {
                                    return (
                                        <div key={rowIdx} style={{ display: 'flex' }}>
                                            {columns.map((col, colIdx) => {
                                                let val = item[col.field];
                                                if (val === undefined && col.field === 'qty') val = item.quantity;
                                                if (val === undefined && col.field === 'quantity') val = item.qty;
                                                if (val === undefined) val = '';
                                                if (col.format === 'currency') val = formatCurrency(val);
                                                return (
                                                    <div key={colIdx} style={{
                                                        width: `${col.width}%`,
                                                        textAlign: col.alignment || 'left',
                                                        overflow: 'hidden',
                                                        whiteSpace: 'nowrap',
                                                        textOverflow: 'ellipsis',
                                                        fontSize: col.fontSize ? `${col.fontSize}px` : 'inherit',
                                                        fontWeight: col.bold ? 'bold' : 'normal'
                                                    }}>
                                                        {val}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                } else if (row.type === 'text') {
                                    return (
                                        <div key={rowIdx} style={{
                                            textAlign: row.alignment || 'left',
                                            fontWeight: row.bold ? 'bold' : 'normal',
                                            fontSize: row.fontSize ? `${row.fontSize}px` : 'inherit',
                                            whiteSpace: 'pre-wrap',
                                            marginTop: '1px',
                                            marginBottom: '1px'
                                        }}>
                                            {processItemText(row.text, item)}
                                        </div>
                                    );
                                } else if (row.type === 'separator') {
                                    return (
                                        <div key={rowIdx} style={{
                                            borderBottom: row.style === 'solid' ? '1px solid black' : '1px dashed black',
                                            margin: '2px 0',
                                            width: '100%'
                                        }}></div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    ))}
                </div>
            );
        }

        // Text fields (Simple or Composite)
        let content = '';
        if (field.type === 'composite' || (field.text && field.text.includes('{'))) {
            content = formatCompositeText(field.text);
        } else if (field.source) {
            content = getValue(field.source);
        } else {
            content = field.text || '';
        }

        // Formatting
        if (field.format === 'currency') content = formatCurrency(content);
        if (field.format === 'date') content = formatDate(content);
        if (field.format === 'time') content = formatTime(content);

        // Label prefix (only if not composite, usually)
        if (field.label && field.type !== 'composite') content = `${field.label} ${content}`;

        return (
            <div key={index} style={style}>
                {content}
            </div>
        );
    };

    return (
        <div
            ref={ref}
            className="receipt-container"
            style={{
                width: pixelWidth,
                backgroundColor: 'white',
                padding: `${config.padding !== undefined ? config.padding : 10}px`,
                margin: '0 auto',
                color: 'black'
            }}
        >
            {config.sections
                .filter(s => s.visible)
                .sort((a, b) => a.order - b.order)
                .map(section => (
                    <div key={section.id} className="receipt-section">
                        {section.type === 'table' ? (
                            renderField({ type: 'table', ...section }, 0)
                        ) : (
                            section.fields && section.fields.map((field, idx) => renderField(field, idx))
                        )}
                    </div>
                ))
            }
        </div>
    );
};

export default React.forwardRef(ReceiptRenderer);

