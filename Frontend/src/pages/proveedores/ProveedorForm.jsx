import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, ChevronDown, ChevronRight, X, Phone, Mail, Globe } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { saveProveedor, getProveedor, updateProveedor } from '../../api/proveedores';

// Reusing the Section component pattern (BC FastTabs)
const Section = ({ title, children, defaultExpanded = true }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <div className="border border-gray-200 bg-white rounded-sm mb-4 shadow-sm overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-100"
            >
                {expanded ? <ChevronDown size={16} className="text-gray-500 mr-2" /> : <ChevronRight size={16} className="text-gray-500 mr-2" />}
                <span className="font-semibold text-sm text-gray-700 uppercase tracking-wide">{title}</span>
            </button>

            {expanded && (
                <div className="p-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

// Reusing Field Component
const Field = ({ label, children, required = false }) => (
    <div className="flex flex-col space-y-1">
        <label className="text-xs font-semibold text-gray-500 truncate flex items-center">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {children}
    </div>
);

const ProveedorForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    // State
    const [config, setConfig] = useState(null);
    const [frecuenciaPago, setFrecuenciaPago] = useState('N/A');
    const [diaPago, setDiaPago] = useState('');

    const [codigoProveedor, setCodigoProveedor] = useState('');
    const [razonSocial, setRazonSocial] = useState('');
    const [numeroDocumento, setNumeroDocumento] = useState('');
    const [tipoComprobante, setTipoComprobante] = useState(''); // [NEW]
    const [direccion, setDireccion] = useState('');
    const [telefono, setTelefono] = useState('');
    const [correo, setCorreo] = useState('');
    const [contacto, setContacto] = useState('');
    const [activo, setActivo] = useState(true);



    // Load Data
    useEffect(() => {
        loadCatalogs();
        loadConfig();
        if (isEditMode) {
            loadProveedor();
        } else {
            // Fetch next code from API
            fetchNextCode();
        }
    }, [isEditMode, id]);

    const fetchNextCode = async () => {
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';
            const res = await fetch(`${API_BASE}/ProveedorConfiguration/NextCode`);
            if (res.ok) {
                const code = await res.text();
                if (code) setCodigoProveedor(code);
                else setCodigoProveedor(`PROV-${Math.floor(1000 + Math.random() * 9000)}`); // Fallback
            }
        } catch (e) {
            console.error("Error fetching next code:", e);
        }
    };

    const loadConfig = async () => {
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';
            const res = await fetch(`${API_BASE}/ProveedorConfiguration`);
            if (res.ok) {
                const conf = await res.json();
                setConfig(conf);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const loadCatalogs = async () => {
        // Placeholder for future catalog loading logic
    };

    const loadProveedor = async () => {
        try {
            const data = await getProveedor(id);
            setCodigoProveedor(data.codigoProveedor);
            setRazonSocial(data.razonSocial);
            setNumeroDocumento(data.numeroDocumento || '');
            setTipoComprobante(data.tipoComprobante || '');
            setDireccion(data.direccion || '');
            setTelefono(data.telefono || '');
            setCorreo(data.correo || '');
            setContacto(data.contacto || '');
            setActivo(data.activo);
        } catch (error) {
            console.error("Error loading provider:", error);
            alert("Error al cargar proveedor");
        }
    };

    const handleSave = async () => {
        if (!razonSocial || !codigoProveedor) {
            alert('Por favor complete los campos obligatorios (*).');
            return;
        }

        const data = {
            CodigoProveedor: codigoProveedor,
            RazonSocial: razonSocial,
            NumeroDocumento: numeroDocumento,
            TipoComprobante: tipoComprobante,
            Direccion: direccion,
            Telefono: telefono,
            Correo: correo,
            Contacto: contacto,
            Activo: activo
        };

        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

            if (isEditMode) {
                await updateProveedor(parseInt(id), { ...data, Id: parseInt(id) });
                navigate('/proveedores');
            } else {
                await saveProveedor(data);
                // Increment sequence after successful save
                await fetch(`${API_BASE}/ProveedorConfiguration/Increment`, { method: 'POST' });
                navigate('/proveedores');
            }
        } catch (error) {
            console.error("Error saving provider:", error);
            alert("Error al guardar proveedor: " + error.message);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 min-h-screen">
            {/* Header Toolbar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/proveedores')} className="text-gray-500 hover:text-gray-800">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 font-medium">Proveedores</span>
                            <span className="text-gray-400 text-xs">/</span>
                            <span className="text-sm text-gray-800 font-bold">{isEditMode ? 'Editar Proveedor' : 'Nuevo Proveedor'}</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">Tarjeta de Proveedor</h1>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Button variant="ghost" className="text-gray-600 hover:bg-gray-100">
                        <span className="text-xs font-medium">Historial</span>
                    </Button>
                    <div className="h-4 w-px bg-gray-300 mx-2"></div>
                    <Button variant="outline" size="sm" onClick={() => navigate('/proveedores')} className="border-gray-300 text-gray-700">
                        <X className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSave} className="bg-hd-orange hover:bg-orange-600 text-white shadow-sm border border-transparent">
                        <Save className="mr-2 h-4 w-4" /> Guardar
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto p-6 max-w-7xl mx-auto w-full">

                <Section title="General">
                    <Field label="No. Proveedor" required>
                        <Input
                            value={codigoProveedor}
                            onChange={(e) => setCodigoProveedor(e.target.value)}
                            placeholder="(Auto)"
                            className="bg-gray-50 border-gray-200"
                        />
                    </Field>
                    <Field label="Nombre / Razón Social" required>
                        <Input
                            value={razonSocial}
                            onChange={(e) => setRazonSocial(e.target.value)}
                            placeholder="Nombre o Razón Social"
                            className="font-medium"
                        />
                    </Field>

                    <Field label="RNC / Tax ID">
                        <Input
                            value={numeroDocumento}
                            onChange={(e) => setNumeroDocumento(e.target.value)}
                            placeholder="001-0000000-0"
                        />
                    </Field>
                    <Field label="Tipo de Comprobante">
                        <select
                            className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-hd-orange focus:border-hd-orange"
                            value={tipoComprobante}
                            onChange={(e) => setTipoComprobante(e.target.value)}
                        >
                            <option value="">-- Seleccione --</option>
                            <option value="B01">Crédito Fiscal (B01)</option>
                            <option value="B02">Consumidor Final (B02)</option>
                            <option value="B11">Proveedor Informal (B11)</option>
                            <option value="B13">Gastos Menores (B13)</option>
                            <option value="B14">Régimen Especial (B14)</option>
                            <option value="B15">Gubernamental (B15)</option>
                        </select>
                    </Field>
                    <Field label="Balance Consolidado (RD$)">
                        <Input placeholder="0.00" className="text-right text-red-600 font-bold border-gray-200" readOnly />
                    </Field>
                    <Field label="Activo">
                        <div className="flex items-center pt-2">
                            <input
                                type="checkbox"
                                checked={activo}
                                onChange={(e) => setActivo(e.target.checked)}
                                className="h-4 w-4 text-hd-orange focus:ring-hd-orange border-gray-300 rounded"
                            />
                        </div>
                    </Field>
                </Section>

                <Section title="Dirección y Contacto" defaultExpanded={true}>
                    <Field label="Dirección">
                        <Input
                            value={direccion}
                            onChange={(e) => setDireccion(e.target.value)}
                            placeholder="Calle, Nave, Local..."
                        />
                    </Field>
                    <Field label="Ciudad">
                        <Input placeholder="Santo Domingo" />
                    </Field>
                    <Field label="País/Región">
                        <select className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-hd-orange focus:border-hd-orange">
                            <option>República Dominicana</option>
                        </select>
                    </Field>

                    <div className="col-span-1 md:col-span-2 lg:col-span-3 h-px bg-gray-100 my-2"></div>

                    <Field label="Teléfono">
                        <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"><Phone size={14} /></span>
                            <Input
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                placeholder="(809) 000-0000"
                                className="rounded-l-none"
                            />
                        </div>
                    </Field>
                    <Field label="Correo Electrónico">
                        <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"><Mail size={14} /></span>
                            <Input
                                type="email"
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                                placeholder="proveedor@empresa.com"
                                className="rounded-l-none text-blue-600 underline"
                            />
                        </div>
                    </Field>
                    <Field label="Sitio Web">
                        <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"><Globe size={14} /></span>
                            <Input placeholder="www.proveedor.com" className="rounded-l-none text-blue-600" />
                        </div>
                    </Field>
                    <Field label="Contacto Principal">
                        <Input
                            value={contacto}
                            onChange={(e) => setContacto(e.target.value)}
                            placeholder="Nombre del contacto"
                        />
                    </Field>
                </Section>

                {/* Section: Pagos y Facturación (Condicional) */}
                {config && config.habilitarPagoRecurrente && (
                    <Section title="Pagos y Facturación">
                        <div className="col-span-1 md:col-span-3 mb-2">
                            <div className="bg-orange-50 border-l-4 border-hd-orange p-3">
                                <p className="text-sm text-orange-700">
                                    <strong>Nota:</strong> Este proveedor está habilitado para pagos configurables.
                                </p>
                            </div>
                        </div>

                        <Field label="Frecuencia de Pago">
                            <select
                                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-hd-orange"
                                value={frecuenciaPago}
                                onChange={(e) => setFrecuenciaPago(e.target.value)}
                            >
                                <option value="N/A">Sin Automatización</option>
                                {config.habilitarFrecuenciaSemanal && <option value="Semanal">Semanal</option>}
                                {config.habilitarFrecuenciaQuincenal && <option value="Quincenal">Quincenal</option>}
                                {config.habilitarFrecuenciaMensual && <option value="Mensual">Mensual</option>}
                                {config.habilitarFechasEspecificas && <option value="FechasEspecificas">Fechas Específicas</option>}
                            </select>
                        </Field>

                        {frecuenciaPago !== 'N/A' && (
                            <Field label={frecuenciaPago === 'FechasEspecificas' ? "Días de Pago (ej: 5, 20)" : "Día Preferido"}>
                                <Input
                                    value={diaPago}
                                    onChange={(e) => setDiaPago(e.target.value)}
                                    placeholder={frecuenciaPago === 'Semanal' ? 'Ej: Viernes' : 'Ej: 15 y 30'}
                                />
                            </Field>
                        )}
                    </Section>
                )}
            </div>
        </div>
    );
};

export default ProveedorForm;
