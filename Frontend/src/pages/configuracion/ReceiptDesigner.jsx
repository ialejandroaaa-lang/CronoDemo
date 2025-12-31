// Componente mejorado del diseñador de recibos con drag & drop completo
import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ArrowLeft, Save, Eye, Copy, Trash2, Plus, Settings, GripVertical, AlignLeft, AlignCenter, AlignRight, Type, Minus, CheckCircle, X, Printer, Edit3, Database, Layers, CheckSquare, ChevronRight, ChevronUp, ChevronDown, Loader2, RefreshCw, MoveHorizontal } from 'lucide-react';

const CUSTOM_STYLES = `
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
    
    @keyframes slideIn {
        from { transform: translateX(20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in { animation: slideIn 0.3s ease forwards; }
`;
import ReceiptRenderer from '../../components/receipt/ReceiptRenderer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { getReceiptTemplates, getReceiptTemplateById, createReceiptTemplate, updateReceiptTemplate, setDefaultTemplate, duplicateTemplate } from '../../api/receiptTemplates';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

const ReceiptDesigner = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [selectedField, setSelectedField] = useState(null);
    const [isSaving, setSaving] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [activeTab, setActiveTab] = useState('properties'); // properties | views
    const [sqlViews, setSqlViews] = useState([]);
    const [selectedView, setSelectedView] = useState('');
    const [viewColumns, setViewColumns] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewError, setViewError] = useState(null);
    const [viewMappingField, setViewMappingField] = useState('receipt.NumeroRecibo');
    const [mockDataMode, setMockDataMode] = useState(false); // To toggle between real SQL data and mocks

    // Printer State
    const [printers, setPrinters] = useState([]);
    const [loadingPrinters, setLoadingPrinters] = useState(false);

    useEffect(() => {
        loadTemplates();
        fetchSqlViews();
        fetchPrinters();
    }, []);

    const fetchPrinters = async () => {
        setLoadingPrinters(true);
        try {
            const res = await fetch(`${API_BASE}/Printers`);
            if (res.ok) {
                const data = await res.json();
                setPrinters(data);
            }
        } catch (error) {
            console.error('Error fetching printers:', error);
        } finally {
            setLoadingPrinters(false);
        }
    };
    const [newSectionName, setNewSectionName] = useState('Información Adicional');
    const [previewData, setPreviewData] = useState({
        company: {
            name: 'MI EMPRESA S.A.',
            rnc: '123-456-789',
            address: 'Calle Principal #123, Santo Domingo',
            phone: '(809) 555-1234'
        },
        receipt: {
            NumeroRecibo: 'REC-0001',
            NumeroFactura: 'FACT-0001',
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            cashier: 'Juan Pérez',
            client: 'Cliente General',
            subtotal: 100.00,
            tax: 18.00,
            total: 118.00,
            paymentMethod: 'Efectivo',
            ncf: 'B0100000001',
            ncfExpiration: '31/12/2025',
            tipoNCF: 'Factura de Crédito Fiscal',
            clientRnc: '101-00000-1',
            clientAddress: 'Av. Winston Churchill, Santo Domingo',
            items: [
                { description: 'Martillo De Uña 16oz', quantity: 1, price: 450.00, total: 450.00, sku: 'HER-001', discount: 0, tax: 81.00 },
                { description: 'Clavos de Acero 2"', quantity: 50, price: 2.50, total: 125.00, sku: 'FER-005', discount: 5.00, tax: 22.50 },
                { description: 'Cinta Métrica 5m', quantity: 1, price: 350.00, total: 350.00, sku: 'HER-002', discount: 0, tax: 63.00 }
            ]
        }
    });

    const availableFields = useMemo(() => {
        const fields = {
            empresa: [
                { id: 'companyLogo', type: 'image', label: 'Logo Empresa', source: 'company.logoPath', height: 60, alignment: 'center' },
                { id: 'companyName', type: 'text', label: 'Nombre Empresa', source: 'company.name', fontSize: 14, bold: true, alignment: 'center' },
                { id: 'companyRNC', type: 'text', label: 'RNC', source: 'company.rnc', fontSize: 10, alignment: 'center' },
                { id: 'companyAddress', type: 'text', label: 'Dirección', source: 'company.address', fontSize: 9, alignment: 'center' },
                { id: 'companyPhone', type: 'text', label: 'Teléfono', source: 'company.phone', fontSize: 9, alignment: 'center' }
            ],
            recibo: [
                { id: 'invoiceNumber', type: 'text', label: 'No. Factura', source: 'receipt.NumeroFactura', fontSize: 10, alignment: 'left' },
                { id: 'receiptNumber', type: 'text', label: 'NumeroRecibo', source: 'receipt.NumeroRecibo', fontSize: 10, alignment: 'left' },
                { id: 'date', type: 'text', label: 'Fecha', source: 'receipt.date', format: 'date', fontSize: 10, alignment: 'left' },
                { id: 'time', type: 'text', label: 'Hora', source: 'receipt.time', format: 'time', fontSize: 10, alignment: 'left' },
                { id: 'cashier', type: 'text', label: 'Cajero', source: 'receipt.cashier', fontSize: 10, alignment: 'left' },
                { id: 'client', type: 'text', label: 'Cliente', source: 'receipt.client', fontSize: 10, alignment: 'left' },
                { id: 'clientRnc', type: 'text', label: 'RNC Cliente', source: 'receipt.clientRnc', fontSize: 10, alignment: 'left' },
                { id: 'clientAddress', type: 'text', label: 'Dirección Cliente', source: 'receipt.clientAddress', fontSize: 10, alignment: 'left' },
                { id: 'ncf', type: 'text', label: 'NCF', source: 'receipt.ncf', fontSize: 10, alignment: 'left' },
                { id: 'ncfExpiration', type: 'text', label: 'Vencimiento NCF', source: 'receipt.ncfExpiration', fontSize: 9, alignment: 'left' },
                { id: 'tipoNCF', type: 'text', label: 'Tipo NCF', source: 'receipt.tipoNCF', fontSize: 9, alignment: 'left' },
                { id: 'itemsTable', type: 'table', label: 'Tabla Detalles (Built-in)', source: 'receipt.items', fontSize: 9 }
            ],
            totales: [
                { id: 'subtotal', type: 'text', label: 'Subtotal', source: 'receipt.subtotal', format: 'currency', fontSize: 10, alignment: 'right' },
                { id: 'itbis', type: 'text', label: 'ITBIS', source: 'receipt.tax', format: 'currency', fontSize: 10, alignment: 'right' },
                { id: 'total', type: 'text', label: 'Total', source: 'receipt.total', format: 'currency', fontSize: 14, bold: true, alignment: 'right' },
                { id: 'paymentMethod', type: 'text', label: 'Método Pago', source: 'receipt.paymentMethod', fontSize: 10, alignment: 'left' }
            ],
            visuales: [
                { id: 'separator', type: 'line', label: 'Línea Separadora', style: 'solid' },
                { id: 'space_small', type: 'space', label: 'Espacio Pequeño', height: 10 },
                { id: 'space_large', type: 'space', label: 'Espacio Grande', height: 20 },
                { id: 'customText', type: 'text', label: 'Texto Simple', text: '¡Gracias por su compra!', fontSize: 12, bold: true, alignment: 'center' },
                { id: 'compositeText', type: 'composite', label: 'Texto Compuesto', text: '{receipt.NumeroRecibo} - {receipt.date}', fontSize: 10, alignment: 'center' }
            ]
        };

        if (selectedView && viewColumns.length > 0) {
            fields.sqlView = viewColumns.map(col => {
                const colName = col.Name || col.name || col.NAME;
                return {
                    id: `sql_${selectedView}_${colName}`,
                    type: 'text',
                    label: `${colName}`,
                    source: `ext.${colName}`,
                    fontSize: 10,
                    alignment: 'left'
                };
            });
        }

        return fields;
    }, [selectedView, viewColumns]);

    const availableVariables = [
        { label: 'Nombre Empresa', value: '{company.name}' },
        { label: 'RNC', value: '{company.rnc}' },
        { label: 'Dirección', value: '{company.address}' },
        { label: 'Teléfono', value: '{company.phone}' },
        { label: 'NumeroRecibo', value: '{receipt.NumeroRecibo}' },
        { label: 'Fecha', value: '{receipt.date}' },
        { label: 'Hora', value: '{receipt.time}' },
        { label: 'Cajero', value: '{receipt.cashier}' },
        { label: 'Cliente', value: '{receipt.client}' },
        { label: 'RNC Cliente', value: '{receipt.clientRnc}' },
        { label: 'Dir. Cliente', value: '{receipt.clientAddress}' },
        { label: 'NCF', value: '{receipt.ncf}' },
        { label: 'Vencimiento NCF', value: '{receipt.ncfExpiration}' },
        { label: 'Tipo NCF', value: '{receipt.tipoNCF}' },
        { label: 'Subtotal', value: '{receipt.subtotal}' },
        { label: 'ITBIS', value: '{receipt.tax}' },
        { label: 'Total', value: '{receipt.total}' },
    ];

    const itemFields = useMemo(() => {
        const standard = [
            { label: 'Descripción', value: 'description' },
            { label: 'Cantidad', value: 'quantity' },
            { label: 'Precio', value: 'price' },
            { label: 'Total Fila', value: 'total' },
            { label: 'SKU / Código', value: 'sku' },
            { label: 'Descuento', value: 'discount' },
            { label: 'ITBIS Art.', value: 'tax' }
        ];

        if (selectedView && viewColumns.length > 0) {
            viewColumns.forEach(col => {
                const colName = col.Name || col.name || col.NAME;
                standard.push({ label: `SQL: ${colName}`, value: colName });
            });
        }
        return standard;
    }, [selectedView, viewColumns]);

    useEffect(() => {
        loadTemplates();
        fetchCompanyConfig();
        fetchSqlViews();
    }, []);

    // Auto-load View Data if template has bindings
    useEffect(() => {
        if (currentTemplate?.config?.sections) {
            const bindedSection = currentTemplate.config.sections.find(s => s.viewBinding?.viewName);
            if (bindedSection) {
                console.log('Template has binding, fetching data for:', bindedSection.viewBinding.viewName);
                fetchViewColumns(bindedSection.viewBinding.viewName);
            }
        }
    }, [currentTemplate?.id]); // Only run when template ID changes to avoid loops

    const fetchSqlViews = async () => {
        setViewLoading(true);
        setViewError(null);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            // Intentar primero un Ping para diagnosticar 404 general
            const pingRes = await fetch(`${API_BASE}/SqlMetadata/Ping`, { signal: controller.signal }).catch(() => null);
            if (pingRes && !pingRes.ok) {
                console.warn('Ping failed, but continuing with Views fetch...');
            }

            const res = await fetch(`${API_BASE}/SqlMetadata/Views`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                console.log('SQL Views loaded:', data);
                setSqlViews(data);
                setViewError(null);
            } else {
                const errorData = await res.json().catch(() => ({}));
                setViewError(errorData.message || `Error del servidor (${res.status}): El endpoint no fue encontrado o el backend no está cargando este controlador.`);
            }
        } catch (error) {
            console.error('Error fetching SQL views:', error);
            if (error.name === 'AbortError') {
                setViewError('La conexión con el servidor SQL tardó demasiado (Timeout).');
            } else {
                setViewError('No se pudo conectar con el servidor. Verifique que el API esté activo en ' + API_BASE);
            }
        } finally {
            setViewLoading(false);
        }
    };

    const runPingTest = async () => {
        setViewLoading(true);
        try {
            const res = await fetch(`${API_BASE}/SqlMetadata/Ping`);
            if (res.ok) {
                const data = await res.json();
                alert(`✅ Conexión Exitosa: ${data.message}`);
                fetchSqlViews();
            } else {
                alert(`❌ Error ${res.status}: El endpoint no responde. Revise si el backend está actualizado.`);
            }
        } catch (e) {
            alert(`❌ Error de red: No se pudo contactar al servidor en ${API_BASE}`);
        } finally {
            setViewLoading(false);
        }
    };

    const fetchViewColumns = async (viewName) => {
        if (!viewName) return;
        setViewLoading(true);
        try {
            // Fetch Columns
            const resCols = await fetch(`${API_BASE}/SqlMetadata/Views/${encodeURIComponent(viewName)}/Columns`);
            if (resCols.ok) {
                const data = await resCols.json();
                setViewColumns(data);
                setSelectedColumns([]);
            }

            // Fetch Sample Data for Preview
            const resData = await fetch(`${API_BASE}/SqlMetadata/Execute/${encodeURIComponent(viewName)}`);
            if (resData.ok) {
                const sample = await resData.json();
                let sampleRow = sample;
                if (Array.isArray(sample)) {
                    sampleRow = sample.length > 0 ? sample[0] : null;
                }

                // If no real data, generate MOCK data for the Designer
                if (!sampleRow && data.length > 0) {
                    sampleRow = {};
                    data.forEach(col => {
                        const colName = col.Name || col.name || col.NAME;
                        // Try to guess type or just use name
                        sampleRow[colName] = `[${colName}]`;
                    });
                    console.log('Generated MOCK data for preview:', sampleRow);
                }

                if (sampleRow) {
                    const normalizedSample = {};
                    Object.keys(sampleRow).forEach(key => {
                        normalizedSample[key] = sampleRow[key]; // Keep original case
                        normalizedSample[key.toLowerCase()] = sampleRow[key]; // Fail-safe
                    });

                    setPreviewData(prev => ({
                        ...prev,
                        ext: normalizedSample
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching view metadata:', error);
        } finally {
            setViewLoading(false);
        }
    };

    const handleAddViewSection = () => {
        if (!selectedView || selectedColumns.length === 0) return;

        const newSectionId = `ext_${selectedView.toLowerCase()}_${Date.now()}`;
        const newFields = selectedColumns.map((colName, idx) => ({
            id: `field_${newSectionId}_${idx}`,
            type: 'text',
            label: colName,
            source: `ext.${colName}`, // Consistent prefix for external view data
            fontSize: 10,
            alignment: 'left',
            marginBottom: 2
        }));

        const newSection = {
            id: newSectionId,
            name: newSectionName,
            order: (currentTemplate.config.sections.length > 0
                ? Math.max(...currentTemplate.config.sections.map(s => s.order))
                : 0) + 1,
            visible: true,
            fields: newFields,
            viewBinding: {
                viewName: selectedView,
                mappingField: viewMappingField
            }
        };

        const newConfig = {
            ...currentTemplate.config,
            sections: [...currentTemplate.config.sections, newSection]
        };

        setCurrentTemplate({ ...currentTemplate, config: newConfig });
        alert('Sección agregada al final del recibo con los campos seleccionados.');
        setActiveTab('properties');
    };

    const fetchCompanyConfig = async () => {
        try {
            const res = await fetch(`${API_BASE}/CompanyConfiguration`);
            if (res.ok) {
                const data = await res.json();
                setPreviewData(prev => ({
                    ...prev,
                    company: {
                        name: data.nombreEmpresa || prev.company.name,
                        rnc: data.rnc || prev.company.rnc,
                        address: data.direccion || prev.company.address,
                        phone: data.telefono || prev.company.phone,
                        logoPath: data.logoPath ? `${API_BASE.replace('/api', '')}${data.logoPath}` : null
                    }
                }));
            }
        } catch (error) {
            console.error('Error fetching company config:', error);
        }
    };

    const loadTemplates = async () => {
        try {
            const data = await getReceiptTemplates();
            setTemplates(data);
            if (data.length > 0) {
                const defaultTemplate = data.find(t => t.porDefecto) || data[0];
                loadTemplate(defaultTemplate.id);
            } else {
                setCurrentTemplate({
                    nombre: 'Nueva Plantilla',
                    tipoRecibo: 'Venta',
                    anchoMM: 80,
                    config: {
                        paperWidth: '80mm',
                        padding: 0,
                        sections: [
                            { id: 'header', name: 'Encabezado', order: 1, visible: true, fields: [] },
                            { id: 'info', name: 'Información', order: 2, visible: true, fields: [] },
                            { id: 'items', name: 'Productos', order: 3, visible: true, type: 'table', fields: [] },
                            { id: 'totals', name: 'Totales', order: 4, visible: true, fields: [] },
                            { id: 'footer', name: 'Pie', order: 5, visible: true, fields: [] }
                        ]
                    }
                });
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    };

    const loadTemplate = async (id) => {
        try {
            const template = await getReceiptTemplateById(id);
            const config = JSON.parse(template.configuracionJSON);
            setCurrentTemplate({ ...template, config });
        } catch (error) {
            console.error('Error loading template:', error);
        }
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        const { source, destination, draggableId } = result;

        if (source.droppableId === 'palette') {
            let field = null;
            for (const category of Object.values(availableFields)) {
                const found = category.find(f => f.id === draggableId);
                if (found) {
                    console.log('Found field in palette:', found);
                    field = { ...found, id: `${found.id}_${Date.now()}` };
                    break;
                }
            }

            if (!field) {
                console.warn('Field not found in palette:', draggableId);
                return;
            }

            const newConfig = { ...currentTemplate.config };
            const sectionIndex = newConfig.sections.findIndex(s => s.id === destination.droppableId);

            if (sectionIndex !== -1) {
                if (!newConfig.sections[sectionIndex].fields) {
                    newConfig.sections[sectionIndex].fields = [];
                }
                newConfig.sections[sectionIndex].fields.splice(destination.index, 0, field);
                setCurrentTemplate({ ...currentTemplate, config: newConfig });
            }
        } else {
            const newConfig = { ...currentTemplate.config };
            const sourceSectionIndex = newConfig.sections.findIndex(s => s.id === source.droppableId);
            const destSectionIndex = newConfig.sections.findIndex(s => s.id === destination.droppableId);

            if (sourceSectionIndex !== -1 && destSectionIndex !== -1) {
                const sourceFields = [...(newConfig.sections[sourceSectionIndex].fields || [])];
                const [movedField] = sourceFields.splice(source.index, 1);

                if (source.droppableId === destination.droppableId) {
                    sourceFields.splice(destination.index, 0, movedField);
                    newConfig.sections[sourceSectionIndex].fields = sourceFields;
                } else {
                    const destFields = [...(newConfig.sections[destSectionIndex].fields || [])];
                    destFields.splice(destination.index, 0, movedField);
                    newConfig.sections[sourceSectionIndex].fields = sourceFields;
                    newConfig.sections[destSectionIndex].fields = destFields;
                }
                setCurrentTemplate({ ...currentTemplate, config: newConfig });
            }
        }
    };

    const updateFieldProperty = (sectionId, fieldId, property, value) => {
        const newConfig = { ...currentTemplate.config };
        const sectionIndex = newConfig.sections.findIndex(s => s.id === sectionId);

        if (sectionIndex !== -1) {
            // Check if we are updating the section itself (e.g. section-level table)
            if (sectionId === fieldId) {
                newConfig.sections[sectionIndex][property] = value;
            } else {
                const fieldIndex = newConfig.sections[sectionIndex].fields.findIndex(f => f.id === fieldId);
                if (fieldIndex !== -1) {
                    newConfig.sections[sectionIndex].fields[fieldIndex][property] = value;
                }
            }
            setCurrentTemplate({ ...currentTemplate, config: newConfig });
            if (selectedField && selectedField.id === fieldId) {
                setSelectedField({ ...selectedField, [property]: value });
            }
        }
    };

    const removeField = (sectionId, fieldId) => {
        const newConfig = { ...currentTemplate.config };
        const sectionIndex = newConfig.sections.findIndex(s => s.id === sectionId);

        if (sectionIndex !== -1) {
            if (sectionId === fieldId) {
                // If it's a section-level table, we just clear its type or remove it? 
                // Let's just reset its type to normal for now if it's a built-in section
                newConfig.sections[sectionIndex].type = undefined;
                newConfig.sections[sectionIndex].fields = [];
            } else {
                newConfig.sections[sectionIndex].fields = newConfig.sections[sectionIndex].fields.filter(f => f.id !== fieldId);
            }
            setCurrentTemplate({ ...currentTemplate, config: newConfig });
            if (selectedField && selectedField.id === fieldId) {
                setSelectedField(null);
            }
        }
    };

    // --- Column Resizing Logic ---
    const handleResizeStart = (e, colIndex, field, sectionId) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const columns = [...(field.columns || [])]; // clone
        const leftCol = columns[colIndex];
        const rightCol = columns[colIndex + 1];

        if (!leftCol || !rightCol) return;

        const startLeftWidth = leftCol.width;
        const startRightWidth = rightCol.width;

        // Find the table container to calculate percentage
        // We use the closest .receipt-table container or fallback to measuring parent
        const tableElement = e.target.closest('.receipt-table');
        if (!tableElement) return;
        const tableWidth = tableElement.offsetWidth;

        const onMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaPercent = (deltaX / tableWidth) * 100;

            // Apply limits (min 5% width)
            let newLeftWidth = startLeftWidth + deltaPercent;
            let newRightWidth = startRightWidth - deltaPercent;

            if (newLeftWidth < 5 || newRightWidth < 5) return;

            // Update local snapshot for smoothness (optional, but better to update state directly here given React structure)
            leftCol.width = newLeftWidth;
            rightCol.width = newRightWidth;

            // We force update by calling updateFieldProperty with the new columns array
            // Optimization: Maybe debouncing this would be better for performance, but straightforward for now.
            updateFieldProperty(sectionId, field.id, 'columns', [...columns]);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const updateTemplateConfig = (property, value) => {
        const newConfig = {
            ...currentTemplate.config,
            [property]: value
        };
        setCurrentTemplate({ ...currentTemplate, config: newConfig });
    };

    const getFieldValue = (source, format) => {
        if (!source) return '';
        const keys = source.split('.');
        let value = previewData;
        for (const key of keys) {
            value = value && value[key] !== undefined ? value[key] : '';
        }
        if (format === 'currency') return `$${Number(value).toFixed(2)}`;
        return value;
    };

    const formatCompositeText = (text) => {
        if (!text) return '';
        return text.replace(/\{([\w\.]+)\}/g, (match, path) => {
            const val = getFieldValue(path);
            return val !== undefined && val !== null ? val : '';
        });
    };

    const renderField = (field, sectionId) => {
        const textAlign = field.alignment || 'left';
        const fontSize = field.fontSize || 10;
        const fontWeight = field.bold ? 'bold' : 'normal';

        if (field.type === 'line') {
            const borderStyle = field.style === 'double' ? 'double' : field.style === 'dashed' ? 'dashed' : 'solid';
            return <hr style={{ borderTop: `1px ${borderStyle} #000`, margin: '5px 0' }} />;
        }

        if (field.type === 'space') {
            return <div style={{ height: `${field.height || 10}px` }} />;
        }

        if (field.type === 'image') {
            const src = getFieldValue(field.source);
            if (!src) return <div className="text-red-500 text-xs text-center">[Imagen no encontrada]</div>;
            return (
                <div style={{ textAlign: field.alignment || 'center', marginBottom: '5px' }}>
                    <img src={src} alt="logo" style={{ maxHeight: `${field.height || 60}px`, maxWidth: '100%', objectFit: 'contain' }} />
                </div>
            );
        }

        if (field.type === 'table') {
            const items = previewData.receipt?.items || [];
            const rawColumns = (field.columns && field.columns.length > 0) ? field.columns : [
                { label: 'Desc', field: 'description', width: 40, active: true },
                { label: 'Cant', field: 'quantity', width: 20, active: true },
                { label: 'Prec', field: 'price', width: 20, active: true, format: 'currency' },
                { label: 'Total', field: 'total', width: 20, active: true, format: 'currency' }
            ];
            const columns = Array.isArray(rawColumns) ? rawColumns.filter(c => c && c.active !== false) : [];
            const rowLayout = field.rowLayout || [{ type: 'columns' }];
            const headerBorder = field.headerBorder || 'dashed';
            const borderStyle = headerBorder === 'none' ? 'none' : `1px ${headerBorder} black`;
            const fmtMoney = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

            if (columns.length === 0 && rowLayout.length === 0) return <div className="p-2 border border-dashed text-gray-400 text-[10px] text-center italic">Tabla sin configuración</div>;

            return (
                <div className="receipt-table" style={{ width: '100%', fontSize: `${fontSize}px`, fontFamily: 'monospace', marginBottom: '5px' }}>
                    {rowLayout.some(r => r.type === 'columns') && (
                        <div style={{ display: 'flex', borderBottom: borderStyle, paddingBottom: '2px', marginBottom: '2px', fontWeight: 'bold', position: 'relative' }}>
                            {columns.map((col, i) => (
                                <div key={i} style={{ width: `${col.width}%`, textAlign: col.alignment || 'left', position: 'relative' }}>
                                    {col.label || 'Col'}
                                    {/* Resizer Handle - Only show if resizeMode is active and not the last column */}
                                    {field.resizeMode && i < columns.length - 1 && (
                                        <div
                                            onMouseDown={(e) => handleResizeStart(e, i, field, sectionId)}
                                            style={{
                                                position: 'absolute',
                                                right: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: '10px',
                                                cursor: 'col-resize',
                                                zIndex: 10,
                                                transform: 'translateX(50%)', // Center on the line
                                                display: 'flex',
                                                justifyContent: 'center'
                                            }}
                                            className="group/resizer hover:bg-blue-100/50" // Highlighting area
                                        >
                                            <div className="w-[2px] h-full bg-blue-400 opacity-50 group-hover/resizer:opacity-100"></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {Array.isArray(items) && items.slice(0, 3).map((item, index) => (
                        <div key={index} style={{ marginBottom: '4px', borderBottom: index < items.length - 1 ? '1px dotted #ccc' : 'none' }}>
                            {rowLayout.map((row, rIdx) => {
                                if (row.type === 'columns') {
                                    return (
                                        <div key={rIdx} style={{ display: 'flex' }}>
                                            {columns.map((col, cIdx) => (
                                                <div key={cIdx} style={{ width: `${col.width}%`, textAlign: col.alignment || 'left', overflow: 'hidden' }}>
                                                    {col.format === 'currency' ? fmtMoney(item[col.field]) : (item[col.field] || '-')}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                } else if (row.type === 'text') {
                                    const textContent = row.text ? row.text.replace(/\{(\w+)\}/g, (m, key) => item[key] || m) : '';
                                    return (
                                        <div key={rIdx} style={{
                                            textAlign: row.alignment || 'left',
                                            fontSize: `${row.fontSize || fontSize - 1}px`,
                                            fontStyle: 'italic',
                                            color: '#666',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {textContent}
                                        </div>
                                    );
                                } else if (row.type === 'separator') {
                                    return <div key={rIdx} style={{ borderTop: '1px dashed #ccc', margin: '2px 0' }} />;
                                }
                                return null;
                            })}
                        </div>
                    ))}
                </div>
            );
        }

        let displayValue = '';
        if (field.type === 'composite' || (field.text && field.text.includes('{'))) {
            displayValue = formatCompositeText(field.text);
        } else {
            displayValue = field.text || (field.source ? getFieldValue(field.source, field.format) : '');
        }

        // Fallback for empty values in Designer to make them visible
        if (!displayValue || displayValue === '') {
            displayValue = `[${field.label || 'Campo Vacío'}]`;
        }

        return (
            <div style={{ textAlign, fontSize: `${fontSize}px`, fontWeight, marginBottom: '3px' }}>
                {displayValue}
            </div>
        );
    };

    const handleSave = async () => {
        if (!currentTemplate) return;
        setSaving(true);
        try {
            // Estructura explícita para asegurar que el backend reciba los nombres correctos (PascalCase)
            // y que no se envíen campos nulos que puedan causar errores en el SQL.
            const payload = {
                Id: currentTemplate.id || 0,
                Nombre: currentTemplate.nombre || currentTemplate.Nombre || 'Nueva Plantilla',
                Descripcion: currentTemplate.descripcion || currentTemplate.Descripcion || '',
                TipoRecibo: currentTemplate.tipoRecibo || currentTemplate.TipoRecibo || 'Venta',
                AnchoMM: currentTemplate.anchoMM || currentTemplate.AnchoMM || (currentTemplate.config?.paperWidth === '58mm' ? 58 : 80),
                PrinterName: currentTemplate.printerName || currentTemplate.PrinterName || '',
                ConfiguracionJSON: JSON.stringify(currentTemplate.config),
                Activo: currentTemplate.activo !== undefined ? currentTemplate.activo : (currentTemplate.Activo !== undefined ? currentTemplate.Activo : true),
                PorDefecto: currentTemplate.porDefecto !== undefined ? currentTemplate.porDefecto : (currentTemplate.PorDefecto !== undefined ? currentTemplate.PorDefecto : false),
                Usuario: currentTemplate.usuario || currentTemplate.Usuario || 'Admin'
            };

            const isTempId = payload.Id && payload.Id > 2000000000;
            if (payload.Id && !isTempId) {
                await updateReceiptTemplate(payload.Id, payload);
            } else {
                const { Id, ...dataToCreate } = payload;
                await createReceiptTemplate(dataToCreate);
            }
            alert('¡Plantilla guardada exitosamente!');
            loadTemplates();
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Error al guardar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSetDefault = async (id) => {
        if (id && id < 2000000000) {
            try {
                await setDefaultTemplate(id);
                alert('Plantilla establecida como activa');
                loadTemplates();
            } catch (error) {
                console.error('Error setting default template:', error);
                alert('Error al activar plantilla');
            }
        } else {
            alert('Debes GUARDAR la plantilla antes de activarla.');
        }
    };

    const handleDuplicate = () => {
        if (!currentTemplate) return;
        const newTemplate = {
            ...currentTemplate,
            id: undefined,
            nombre: `${currentTemplate.nombre} (Copia)`,
            porDefecto: false
        };
        const tempId = Date.now();
        setTemplates([...templates, { ...newTemplate, id: tempId }]);
        setCurrentTemplate({ ...newTemplate, id: tempId });
        alert('Copia creada. Recuerda GUARDAR.');
    };

    const insertVariable = (variable) => {
        if (!selectedField) return;
        const currentText = selectedField.text || '';
        updateFieldProperty(selectedField.sectionId, selectedField.id, 'text', currentText + variable);
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <style>{CUSTOM_STYLES}</style>
            <div className="flex flex-col h-screen bg-gray-100 font-sans text-gray-800">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => navigate('/configuracion/pos')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Diseñador de Recibos</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <select
                                    className="text-xs bg-gray-50 border rounded px-2 py-1 font-semibold text-gray-700 focus:ring-1 focus:ring-hd-orange"
                                    value={currentTemplate?.id || ''}
                                    onChange={(e) => loadTemplate(e.target.value)}
                                >
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.nombre}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-2 py-0.5 bg-gray-100 rounded">
                                    {currentTemplate?.tipoRecibo || 'Venta'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                            <div className={`h-2 w-2 rounded-full ${viewError && viewError.includes('API') ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">{viewError && viewError.includes('API') ? 'API Offline' : 'API Online'}</span>
                        </div>
                        <Button variant="outline" className="h-9 px-4 text-gray-600 hover:text-hd-orange transition-colors" onClick={() => navigate('/configuracion')}>
                            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
                        </Button>
                        <div className="h-6 w-px bg-gray-200"></div>
                        <Button variant="outline" className="h-9 px-4 text-gray-600" onClick={() => setShowPreviewModal(true)}>
                            <Eye className="h-4 w-4 mr-2" /> Previsualizar
                        </Button>
                        <Button className="h-9 px-6 bg-hd-orange text-white hover:bg-orange-600 shadow-md transform active:scale-95 transition-all" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            GUARDAR CAMBIOS
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Fields Palette */}
                    <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
                        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Paleta de Campos</h3>
                            <Plus className="h-4 w-4 text-hd-orange" />
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                            <Droppable droppableId="palette" isDropDisabled={true}>
                                {(provided) => {
                                    // Flatten fields to ensure a single continuous list for indexing if needed, 
                                    // but we want to keep categories visually. 
                                    // We'll maintain the global index counter effectively.
                                    let globalIndex = 0;

                                    return (
                                        <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: '100%' }}>
                                            {Object.entries(availableFields).map(([category, fields]) => (
                                                <div key={category} className="mb-8">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="h-1 w-1 bg-hd-orange rounded-full"></div>
                                                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{category === 'sqlView' ? 'DATO EXTERNO (SQL)' : category}</h4>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {fields.map((field) => {
                                                            const currentIndex = globalIndex++;
                                                            return (
                                                                <Draggable key={field.id} draggableId={field.id} index={currentIndex}>
                                                                    {(provided, snapshot) => (
                                                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                                                            style={{ ...provided.draggableProps.style }}
                                                                            className={`p-3 bg-white border border-gray-100 rounded shadow-sm cursor-move hover:border-hd-orange hover:shadow-md transition-all group ${snapshot.isDragging ? 'ring-2 ring-hd-orange ring-opacity-50' : ''}`}>
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-2">
                                                                                    <GripVertical className="h-4 w-4 text-gray-300 group-hover:text-hd-orange" />
                                                                                    <span className="text-xs font-bold text-gray-700">{field.label}</span>
                                                                                </div>
                                                                                {category === 'sqlView' && <Database className="h-3 w-3 text-blue-400" />}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    );
                                }}
                            </Droppable>
                        </div>
                    </div>

                    {/* Center: Canvas Workspace */}
                    <div className="flex-1 overflow-y-auto bg-gray-200/50 p-12 custom-scrollbar flex justify-center items-start">
                        <div className="relative">
                            {/* Decorative Tape for realism */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-gray-400/20 rounded z-0"></div>

                            <div className="bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] border-t-[3px] border-hd-orange overflow-hidden relative z-10"
                                style={{ width: currentTemplate?.config?.paperWidth === '58mm' ? '220px' : '302px', minHeight: '600px', transition: 'width 0.3s ease' }}>

                                {/* Top Edge Detail */}
                                <div className="h-2 w-full bg-white relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 flex justify-around opacity-20">
                                        {Array(20).fill(0).map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-gray-300 -mt-1"></div>)}
                                    </div>
                                </div>

                                <div className="p-4">
                                    {currentTemplate?.config?.sections?.map((section) => (
                                        <Droppable key={section.id} droppableId={section.id}>
                                            {(provided, snapshot) => (
                                                <div ref={provided.innerRef} {...provided.droppableProps}
                                                    className={`min-h-[40px] mb-4 p-2 rounded ${snapshot.isDraggingOver ? 'bg-orange-50 border border-orange-200' : 'border border-transparent'}`}>
                                                    <div className="text-[10px] text-gray-400 mb-1.5 font-black uppercase flex justify-between items-center tracking-tighter">
                                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{section.name}</span>
                                                        {section.type === 'table' && <span className="text-blue-500 flex items-center gap-1 cursor-pointer hover:underline" onClick={() => setSelectedField({ ...section, sectionId: section.id })}><Database size={10} /> Editar Columnas</span>}
                                                    </div>

                                                    {section.type === 'table' ? (
                                                        <div className={`p-1 rounded cursor-pointer ${selectedField?.id === section.id ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-50'}`}
                                                            onClick={() => setSelectedField({ ...section, sectionId: section.id })}>
                                                            {renderField({ type: 'table', ...section }, section.id)}
                                                        </div>
                                                    ) : (
                                                        section.fields?.map((field, index) => (
                                                            <Draggable key={field.id} draggableId={field.id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <div ref={provided.innerRef} {...provided.draggableProps}
                                                                        className={`group relative ${snapshot.isDragging ? 'opacity-50' : ''}`}
                                                                        onClick={() => setSelectedField({ ...field, sectionId: section.id })}>
                                                                        <div {...provided.dragHandleProps} className="absolute -left-4 top-1 opacity-0 group-hover:opacity-100 cursor-move">
                                                                            <GripVertical className="h-4 w-4 text-gray-400" />
                                                                        </div>
                                                                        <div className={`p-1 rounded ${selectedField?.id === field.id ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-50'}`}>
                                                                            {renderField(field, section.id)}
                                                                        </div>
                                                                        <button onClick={(e) => { e.stopPropagation(); removeField(section.id, field.id); }}
                                                                            className="absolute -right-4 top-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700">
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))
                                                    )}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Properties & Views */}
                    <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden shadow-xl">
                        <div className="flex border-b">
                            <button onClick={() => setActiveTab('properties')}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'properties' ? 'text-hd-orange border-b-2 border-hd-orange bg-orange-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                                <Settings className="h-3.5 w-3.5" /> Propiedades
                            </button>
                            <button onClick={() => setActiveTab('views')}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'views' ? 'text-hd-orange border-b-2 border-hd-orange bg-orange-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                                <Database className="h-3.5 w-3.5" /> Vista SQL
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {activeTab === 'properties' ? (
                                <div className="p-4 space-y-4">
                                    <h3 className="text-xs font-black text-gray-700 uppercase tracking-tight flex items-center gap-2">
                                        {selectedField ? <Edit3 size={14} className="text-hd-orange" /> : <Layers size={14} className="text-hd-orange" />}
                                        {selectedField ? 'Configurar Campo' : 'Diseño del Recibo'}
                                    </h3>

                                    {selectedField ? (
                                        <div className="space-y-5 animate-in slide-in-from-right-2 duration-200">
                                            {/* Standard Properties */}
                                            <div className="space-y-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <div>
                                                    <label className="block text-[8px] font-black text-gray-400 uppercase mb-2 tracking-widest">Alineación Horizontal</label>
                                                    <div className="flex gap-1">
                                                        {['left', 'center', 'right'].map(align => (
                                                            <button key={align}
                                                                onClick={() => updateFieldProperty(selectedField.sectionId, selectedField.id, 'alignment', align)}
                                                                className={`flex-1 h-8 flex items-center justify-center rounded border transition-all ${selectedField.alignment === align ? 'bg-hd-orange text-white border-hd-orange shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:border-hd-orange hover:text-hd-orange'}`}>
                                                                {align === 'left' && <AlignLeft size={16} />}
                                                                {align === 'center' && <AlignCenter size={16} />}
                                                                {align === 'right' && <AlignRight size={16} />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[8px] font-black text-gray-400 uppercase mb-1 tracking-widest">Tamaño (px)</label>
                                                        <Input type="number" value={selectedField.fontSize || 10} className="h-8 text-xs font-bold"
                                                            onChange={(e) => updateFieldProperty(selectedField.sectionId, selectedField.id, 'fontSize', parseInt(e.target.value))} />
                                                    </div>
                                                    <div className="flex flex-col justify-end">
                                                        <label className="flex items-center gap-2 cursor-pointer h-8 px-2 bg-white border rounded hover:border-hd-orange transition-colors">
                                                            <input type="checkbox" checked={selectedField.bold || false} className="rounded text-hd-orange focus:ring-hd-orange"
                                                                onChange={(e) => updateFieldProperty(selectedField.sectionId, selectedField.id, 'bold', e.target.checked)} />
                                                            <span className="text-[10px] font-bold text-gray-600">Negrita</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Type Specific: Composite */}
                                            {selectedField.type === 'composite' && (
                                                <div className="space-y-3 p-3 bg-white border rounded-lg shadow-sm">
                                                    <label className="block text-[10px] font-bold text-gray-700 uppercase">Texto Dinámico</label>
                                                    <textarea value={selectedField.text || ''} rows={3} className="w-full text-xs border rounded-md p-2 focus:ring-1 focus:ring-hd-orange outline-none bg-gray-50"
                                                        onChange={(e) => updateFieldProperty(selectedField.sectionId, selectedField.id, 'text', e.target.value)}
                                                        placeholder="Escribe aquí. Usa el menú de abajo para insertar variables." />
                                                    <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-1.5 border rounded bg-gray-50 custom-scrollbar">
                                                        {availableVariables.map(v => (
                                                            <button key={v.value} onClick={() => insertVariable(v.value)}
                                                                className="text-left text-[9px] p-2 bg-white border border-gray-100 rounded shadow-sm truncate hover:border-hd-orange hover:text-hd-orange transition-colors">
                                                                {v.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Type Specific: Table */}
                                            {selectedField.type === 'table' && (
                                                <div className="space-y-6">
                                                    {/* Column Editor */}
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center bg-gray-800 text-white p-2.5 rounded-t-lg">
                                                            <div className="flex flex-col">
                                                                <label className="text-[10px] font-black uppercase tracking-tighter">Columnas Principales</label>
                                                                <span className="text-[9px] text-gray-400">Campos en la fila central</span>
                                                            </div>
                                                            <div className="flex gap-1 items-center">

                                                                {/* Resize Mode Toggle */}
                                                                <button
                                                                    onClick={() => updateFieldProperty(selectedField.sectionId, selectedField.id, 'resizeMode', !selectedField.resizeMode)}
                                                                    className={`px-2 py-1 rounded text-[9px] font-black uppercase transition-colors flex items-center gap-1 ${selectedField.resizeMode ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                                                                    title="Activar para redimensionar columnas con el mouse"
                                                                >
                                                                    <MoveHorizontal size={10} /> {selectedField.resizeMode ? 'Ajustando' : 'Ajustar'}
                                                                </button>

                                                                <div className="w-px h-3 bg-gray-600 mx-1"></div>

                                                                <button onClick={() => {
                                                                    const currentCols = selectedField.columns || [
                                                                        { label: 'Desc', field: 'description', width: 40, active: true },
                                                                        { label: 'Cant', field: 'quantity', width: 20, active: true },
                                                                        { label: 'Prec', field: 'price', width: 20, active: true, format: 'currency' },
                                                                        { label: 'Total', field: 'total', width: 20, active: true, format: 'currency' }
                                                                    ];
                                                                    // We want to add a new column with 20% width.
                                                                    // To keep total at 100, we scale down existing columns by factor (80/100 = 0.8)
                                                                    const scaleFactor = 0.8;
                                                                    const updatedCols = currentCols.map(c => ({
                                                                        ...c,
                                                                        width: Math.floor(c.width * scaleFactor)
                                                                    }));

                                                                    // Calculate remaining to ensure exactly 100
                                                                    const currentSum = updatedCols.reduce((sum, c) => sum + c.width, 0);
                                                                    const newColWidth = 100 - currentSum;

                                                                    const newCol = { label: 'Nuevo', field: 'description', width: newColWidth, alignment: 'left', active: true };
                                                                    updateFieldProperty(selectedField.sectionId, selectedField.id, 'columns', [...updatedCols, newCol]);
                                                                }} className="px-2 py-1 bg-hd-orange rounded text-[9px] font-black uppercase hover:bg-white hover:text-hd-orange transition-colors">+ Col</button>
                                                                <button onClick={() => {
                                                                    const defaultCols = [
                                                                        { label: 'Desc', field: 'description', width: 40, active: true },
                                                                        { label: 'Cant', field: 'quantity', width: 20, active: true },
                                                                        { label: 'Prec', field: 'price', width: 20, active: true, format: 'currency' },
                                                                        { label: 'Total', field: 'total', width: 20, active: true, format: 'currency' }
                                                                    ];
                                                                    updateFieldProperty(selectedField.sectionId, selectedField.id, 'columns', defaultCols);
                                                                }} className="px-2 py-1 bg-white/10 rounded text-[9px] font-black uppercase hover:bg-white/20 transition-colors">Reset</button>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2 max-h-60 overflow-y-auto p-1.5 border border-t-0 rounded-b-lg bg-gray-50 custom-scrollbar">
                                                            {(selectedField.columns || []).map((col, idx) => (
                                                                <div key={idx} className="bg-white p-2 rounded border border-gray-200 space-y-2 shadow-sm relative group/col">
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <Input placeholder="Etiqueta" value={col.label} className="h-7 text-[10px] font-bold"
                                                                            onChange={(e) => {
                                                                                const newCols = [...(selectedField.columns || [])];
                                                                                newCols[idx].label = e.target.value;
                                                                                updateFieldProperty(selectedField.sectionId, selectedField.id, 'columns', newCols);
                                                                            }} />
                                                                        <select value={col.field} className="h-7 text-[10px] border rounded bg-white focus:ring-1 focus:ring-hd-orange outline-none"
                                                                            onChange={(e) => {
                                                                                const newCols = [...(selectedField.columns || [])];
                                                                                newCols[idx].field = e.target.value;
                                                                                updateFieldProperty(selectedField.sectionId, selectedField.id, 'columns', newCols);
                                                                            }}>
                                                                            <option value="">Seleccionar Campo...</option>
                                                                            {itemFields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                                                        </select>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 pt-1.5 border-t border-gray-100">
                                                                        <div className="flex bg-gray-100 rounded p-0.5">
                                                                            {['left', 'center', 'right'].map(align => (
                                                                                <button
                                                                                    key={align}
                                                                                    onClick={() => {
                                                                                        const newCols = [...(selectedField.columns || [])];
                                                                                        newCols[idx].alignment = align;
                                                                                        updateFieldProperty(selectedField.sectionId, selectedField.id, 'columns', newCols);
                                                                                    }}
                                                                                    className={`p-1 rounded text-gray-500 hover:text-hd-orange transition-colors ${col.alignment === align ? 'bg-white shadow text-hd-orange font-bold' : ''}`}
                                                                                    title={align === 'left' ? 'Izquierda' : align === 'center' ? 'Centro' : 'Derecha'}
                                                                                >
                                                                                    {align === 'left' && <AlignLeft size={10} />}
                                                                                    {align === 'center' && <AlignCenter size={10} />}
                                                                                    {align === 'right' && <AlignRight size={10} />}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                        <div className="flex items-center bg-gray-100 rounded px-2 h-6 flex-1">
                                                                            <span className="text-[8px] font-black text-gray-400 mr-2 uppercase">W%</span>
                                                                            <input type="number" value={col.width} className="bg-transparent text-[10px] font-bold w-full text-center outline-none"
                                                                                onChange={(e) => {
                                                                                    const newCols = [...(selectedField.columns || [])];
                                                                                    newCols[idx].width = parseInt(e.target.value);
                                                                                    updateFieldProperty(selectedField.sectionId, selectedField.id, 'columns', newCols);
                                                                                }} />
                                                                        </div>
                                                                        <select value={col.format || ''} className="h-6 text-[9px] border rounded flex-1 bg-white"
                                                                            onChange={(e) => {
                                                                                const newCols = [...(selectedField.columns || [])];
                                                                                newCols[idx].format = e.target.value;
                                                                                updateFieldProperty(selectedField.sectionId, selectedField.id, 'columns', newCols);
                                                                            }}>
                                                                            <option value="">Sin Formato</option>
                                                                            <option value="currency">Moneda ($)</option>
                                                                        </select>
                                                                        <button className="text-gray-300 hover:text-red-500 transition-colors ml-auto" onClick={() => {
                                                                            const newCols = (selectedField.columns || []).filter((_, i) => i !== idx);
                                                                            updateFieldProperty(selectedField.sectionId, selectedField.id, 'columns', newCols);
                                                                        }}><Trash2 size={12} /></button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Multi-line Layout */}
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center bg-hd-orange text-white p-2.5 rounded-t-lg">
                                                            <div className="flex flex-col">
                                                                <label className="text-[10px] font-black uppercase tracking-tighter">Fila Extra (Multi-línea)</label>
                                                                <span className="text-[9px] text-orange-100">Líneas arriba o abajo</span>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button onClick={() => {
                                                                    const layout = selectedField.rowLayout || [{ type: 'columns' }];
                                                                    updateFieldProperty(selectedField.sectionId, selectedField.id, 'rowLayout', [...layout, { type: 'text', text: 'Ref: {sku}', alignment: 'left', fontSize: 8 }]);
                                                                }} className="px-2 py-1 bg-white text-hd-orange rounded text-[9px] font-black uppercase hover:bg-orange-50 transition-colors">+ Texto</button>
                                                                <button onClick={() => {
                                                                    const layout = selectedField.rowLayout || [{ type: 'columns' }];
                                                                    updateFieldProperty(selectedField.sectionId, selectedField.id, 'rowLayout', [...layout, { type: 'separator' }]);
                                                                }} className="px-2 py-1 bg-white text-hd-orange rounded text-[9px] font-black uppercase hover:bg-orange-50 transition-colors">+ Raya</button>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2 p-1.5 border border-t-0 rounded-b-lg bg-gray-50 max-h-60 overflow-y-auto custom-scrollbar">
                                                            {(selectedField.rowLayout || [{ type: 'columns' }]).map((row, rIdx, arr) => (
                                                                <div key={rIdx} className="bg-white p-2 rounded border border-gray-100 flex flex-col gap-2 group/row shadow-sm">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${row.type === 'columns' ? 'bg-hd-orange/10 text-hd-orange' : 'bg-gray-100 text-gray-500'}`}>
                                                                            {row.type === 'columns' ? 'Columnas' : row.type === 'text' ? 'Texto' : 'Raya'}
                                                                        </span>
                                                                        <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                                            {rIdx > 0 && <button onClick={() => {
                                                                                const layout = [...(selectedField.rowLayout || [])];
                                                                                [layout[rIdx], layout[rIdx - 1]] = [layout[rIdx - 1], layout[rIdx]];
                                                                                updateFieldProperty(selectedField.sectionId, selectedField.id, 'rowLayout', layout);
                                                                            }} className="text-gray-500 hover:text-hd-orange p-1 bg-gray-100 rounded" title="Subir"><ChevronUp size={14} /></button>}
                                                                            {rIdx < arr.length - 1 && <button onClick={() => {
                                                                                const layout = [...(selectedField.rowLayout || [])];
                                                                                [layout[rIdx], layout[rIdx + 1]] = [layout[rIdx + 1], layout[rIdx]];
                                                                                updateFieldProperty(selectedField.sectionId, selectedField.id, 'rowLayout', layout);
                                                                            }} className="text-gray-500 hover:text-hd-orange p-1 bg-gray-100 rounded" title="Bajar"><ChevronDown size={14} /></button>}
                                                                            {row.type !== 'columns' && <button onClick={() => {
                                                                                const layout = (selectedField.rowLayout || []).filter((_, i) => i !== rIdx);
                                                                                updateFieldProperty(selectedField.sectionId, selectedField.id, 'rowLayout', layout);
                                                                            }} className="text-red-400 hover:text-red-600 ml-1 p-1 bg-red-50 rounded"><Trash2 size={14} /></button>}
                                                                        </div>
                                                                    </div>
                                                                    {row.type === 'text' && (
                                                                        <div className="flex items-center gap-1">
                                                                            <Input value={row.text} className="h-7 text-[10px] flex-1" placeholder="Ej: SKU: {sku}"
                                                                                onChange={(e) => {
                                                                                    const layout = [...(selectedField.rowLayout || [])];
                                                                                    layout[rIdx].text = e.target.value;
                                                                                    updateFieldProperty(selectedField.sectionId, selectedField.id, 'rowLayout', layout);
                                                                                }} />
                                                                            <select value="" className="h-7 w-8 text-center bg-gray-50 border rounded font-black text-hd-orange text-xs cursor-pointer"
                                                                                onChange={(e) => {
                                                                                    if (!e.target.value) return;
                                                                                    const layout = [...(selectedField.rowLayout || [])];
                                                                                    layout[rIdx].text = (layout[rIdx].text || '') + ` {${e.target.value}}`;
                                                                                    updateFieldProperty(selectedField.sectionId, selectedField.id, 'rowLayout', layout);
                                                                                }}>
                                                                                <option value="">+</option>
                                                                                {itemFields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                                                            </select>
                                                                        </div>
                                                                    )}
                                                                    {row.type === 'separator' && <div className="h-px w-full border-t border-dashed border-gray-200"></div>}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <Button variant="outline" className="w-full h-9 text-[10px] font-black uppercase tracking-widest border-2 hover:bg-gray-50" onClick={() => setSelectedField(null)}>Cerrar Editor</Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 animate-in fade-in duration-300">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest flex items-center gap-2">
                                                    <div className="h-2 w-2 bg-hd-orange rounded-full"></div> Ancho del Papel
                                                </label>
                                                <div className="flex gap-2">
                                                    {['80mm', '58mm'].map(w => (
                                                        <button key={w} onClick={() => updateTemplateConfig('paperWidth', w)}
                                                            className={`flex-1 p-3 border-2 rounded-xl flex flex-col items-center gap-1 transition-all ${currentTemplate?.config?.paperWidth === w ? 'border-hd-orange bg-orange-50 text-hd-orange shadow-inner' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}>
                                                            <div className="text-sm font-bold">{w}</div>
                                                            <div className="text-[8px] uppercase tracking-tighter">{w === '80mm' ? 'Estándar' : 'Cintas'}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Márgenes Laterales</label>
                                                    <span className="text-[10px] font-bold text-hd-orange">{currentTemplate?.config?.padding || 0}px</span>
                                                </div>
                                                <input type="range" min="0" max="30" value={currentTemplate?.config?.padding || 0} className="w-full accent-hd-orange"
                                                    onChange={(e) => updateTemplateConfig('padding', parseInt(e.target.value))} />
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest flex items-center gap-2">
                                                    <Printer className="h-3 w-3 text-gray-400" /> Impresora Predeterminada
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={currentTemplate?.printerName || ''}
                                                        onChange={(e) => {
                                                            setCurrentTemplate(prev => ({ ...prev, printerName: e.target.value }));
                                                        }}
                                                        className="w-full h-10 text-xs font-bold border border-gray-200 rounded-lg px-3 bg-white focus:ring-2 focus:ring-hd-orange outline-none shadow-sm appearance-none"
                                                    >
                                                        <option value="">-- Sin Impresora Asignada --</option>
                                                        {printers.map(p => (
                                                            <option key={p} value={p}>{p}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-3 top-3 pointer-events-none">
                                                        {loadingPrinters ? <RefreshCw className="h-4 w-4 text-hd-orange animate-spin" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                                    </div>
                                                </div>
                                                <p className="text-[8px] text-gray-400 mt-1.5 italic">Esta impresora se usará automáticamente al imprimir este recibo.</p>
                                            </div>
                                            <div className="p-4 bg-orange-100/50 rounded-xl border border-orange-100 flex flex-col gap-2">
                                                <Layers className="h-5 w-5 text-blue-400 shrink-0" />
                                                <p className="text-[9px] text-blue-600 leading-tight">Las vistas SQL te permiten traer datos externos (como estados de cuenta o turnos) a tu recibo.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 space-y-4 h-full flex flex-col">
                                    {!selectedView ? (
                                        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <h3 className="text-xs font-black text-gray-700 uppercase tracking-tight flex items-center gap-2">
                                                        <Database className="h-4 w-4 text-hd-orange" /> Objetos de Datos SQL
                                                    </h3>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{API_BASE}</span>
                                                </div>
                                                <button onClick={fetchSqlViews} disabled={viewLoading} className="p-2 hover:bg-orange-50 rounded-full transition-colors text-hd-orange disabled:opacity-30">
                                                    <RefreshCw className={`h-4 w-4 ${viewLoading ? 'animate-spin' : ''}`} />
                                                </button>
                                            </div>

                                            <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl bg-gray-50/50 custom-scrollbar">
                                                {viewLoading && (
                                                    <div className="p-12 text-center text-gray-400">
                                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-hd-orange" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">Conectando...</p>
                                                    </div>
                                                )}
                                                {viewError && (
                                                    <div className="p-8 text-center bg-red-50 border border-red-100 rounded-lg m-2">
                                                        <X className="h-8 w-8 mx-auto mb-2 text-red-500 opacity-50" />
                                                        <p className="text-[10px] font-black text-red-600 uppercase mb-2">Error de Conexión</p>
                                                        <p className="text-[9px] text-red-500 italic mb-3">{viewError}</p>
                                                        <Button size="sm" variant="outline" className="h-7 text-[9px] border-red-200 text-red-600 hover:bg-red-50" onClick={fetchSqlViews}>REINTENTAR</Button>
                                                    </div>
                                                )}
                                                {!viewLoading && !viewError && sqlViews.length === 0 && (
                                                    <div className="p-12 text-center">
                                                        <Database className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Sin datos disponibles</p>
                                                        <p className="text-[9px] text-gray-400 italic mt-2">No se encontraron Vistas o Tablas en el SQL del Backend.</p>
                                                    </div>
                                                )}
                                                {sqlViews.map((view, vIdx) => {
                                                    const viewName = view.Name || view.name || view.NAME;
                                                    const viewType = view.Type || view.type || 'View';
                                                    return (
                                                        <button key={viewName || vIdx} onClick={() => { setSelectedView(viewName); fetchViewColumns(viewName); }}
                                                            className="w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-white flex justify-between items-center group transition-all hover:shadow-sm">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-xs text-gray-700">{viewName}</span>
                                                                <span className="text-[8px] text-orange-400 px-1 py-0.5 bg-orange-50 rounded uppercase font-black self-start mt-1 tracking-tighter">{viewType}</span>
                                                            </div>
                                                            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-hd-orange transition-transform group-hover:translate-x-1" />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex gap-3">
                                                <Layers className="h-5 w-5 text-blue-400 shrink-0" />
                                                <p className="text-[9px] text-blue-600 leading-tight">Las vistas SQL te permiten traer datos externos (como estados de cuenta o turnos) a tu recibo.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in slide-in-from-right duration-300 flex-1 flex flex-col">
                                            <div className="flex items-center justify-between">
                                                <button onClick={() => setSelectedView('')} className="text-[10px] font-black text-hd-orange flex items-center gap-1 uppercase hover:underline tracking-tight">
                                                    <ArrowLeft className="h-3 w-3" /> Lista de Vistas
                                                </button>
                                                <span className="text-[9px] font-black text-gray-400 bg-gray-100 px-2 py-1 rounded uppercase tracking-tighter">{selectedView}</span>
                                            </div>

                                            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50/50 shadow-inner custom-scrollbar">
                                                {viewLoading ? (
                                                    <div className="p-12 text-center text-gray-400">
                                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-hd-orange" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">Leyendo SQL...</p>
                                                    </div>
                                                ) : (
                                                    <div className="p-1 space-y-1">
                                                        {viewColumns.map(col => {
                                                            const colName = col.Name || col.name || col.NAME;
                                                            return (
                                                                <label key={colName} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-transparent hover:border-hd-orange cursor-pointer transition-all shadow-sm">
                                                                    <input type="checkbox" className="rounded text-hd-orange focus:ring-hd-orange" checked={selectedColumns.includes(colName)}
                                                                        onChange={(e) => e.target.checked ? setSelectedColumns([...selectedColumns, colName]) : setSelectedColumns(selectedColumns.filter(c => c !== colName))} />
                                                                    <span className="text-xs font-bold text-gray-600">{colName}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-3 bg-white p-3 rounded-xl border border-gray-100 shadow-lg mt-auto">
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Vincular con (Parámetro)</label>
                                                    <select
                                                        value={viewMappingField}
                                                        onChange={(e) => setViewMappingField(e.target.value)}
                                                        className="w-full h-9 text-xs font-bold border rounded px-2 bg-white focus:ring-1 focus:ring-hd-orange outline-none"
                                                    >
                                                        <option value="receipt.NumeroRecibo">NumeroRecibo (REC-XXXX)</option>
                                                        <option value="receipt.NumeroFactura">No. Factura (FACT-XXXX)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Nombre del Nuevo Grupo</label>
                                                    <Input value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} placeholder="Ej: Historial Pagos" className="h-9 text-xs font-bold focus:ring-hd-orange" />
                                                </div>
                                                <Button onClick={handleAddViewSection} disabled={selectedColumns.length === 0} className="w-full bg-hd-orange text-white text-xs font-black h-10 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all uppercase tracking-widest">
                                                    VINCULAR DATOS
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Preview Modal */}
                {showPreviewModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="px-5 py-4 bg-gray-50 border-b flex items-center justify-between">
                                <h3 className="font-black text-gray-800 uppercase tracking-widest text-xs flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-hd-orange" /> Previsualización Real
                                </h3>
                                <button onClick={() => setShowPreviewModal(false)} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"><X className="h-5 w-5 text-gray-400" /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 sm:p-10 flex justify-center bg-gray-200 custom-scrollbar">
                                <div className="bg-white shadow-2xl p-6 ring-1 ring-black/5 h-fit mb-10" style={{ width: currentTemplate?.config?.paperWidth === '58mm' ? '220px' : '302px', minHeight: '400px' }}>
                                    <ReceiptRenderer template={currentTemplate} data={previewData} />
                                </div>
                            </div>
                            <div className="px-5 py-4 bg-gray-50 border-t flex justify-end gap-3">
                                <Button variant="outline" className="h-10 text-xs font-bold px-6" onClick={() => setShowPreviewModal(false)}>Cerrar</Button>
                                <Button className="bg-hd-orange text-white h-10 text-xs font-black uppercase tracking-widest px-6 shadow-md" onClick={() => window.print()}><Printer className="h-5 w-5 mr-2" /> Imprimir</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DragDropContext >
    );
};

export default ReceiptDesigner;
