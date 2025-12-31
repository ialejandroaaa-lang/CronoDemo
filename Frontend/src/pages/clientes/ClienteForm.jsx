import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, ChevronDown, ChevronRight, X, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getNivelesPrecio } from '../../api/nivelesPrecio';

// Componente para simular los "FastTabs" de Business Central
const ClientLedger = ({ clientId }) => {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!clientId) return;
        setLoading(true);
        fetch(`http://localhost:5006/api/Clients/${clientId}/Statement`)
            .then(res => res.json())
            .then(data => setMovements(Array.isArray(data) ? data : []))
            .catch(err => console.error("Error loading ledger:", err))
            .finally(() => setLoading(false));
    }, [clientId]);

    if (!clientId) return <div className="text-gray-400 p-4">Guarde el cliente para ver su estado de cuenta.</div>;

    const formatMoney = (val) => val ? `RD$ ${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '-';

    return (
        <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Débito</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Crédito</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Saldo</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                        <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">Cargando movimientos...</td></tr>
                    ) : movements.length === 0 ? (
                        <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No hay movimientos registrados.</td></tr>
                    ) : (
                        movements.map((mov, idx) => (
                            <tr key={`${mov.refId}-${idx}`} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(mov.fecha).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {mov.documento}
                                    {mov.referencia && <div className="text-xs text-gray-400 font-normal">{mov.referencia}</div>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${mov.tipo === 'Factura' ? 'bg-blue-100 text-blue-800' :
                                        mov.tipo === 'Cobro' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {mov.tipo}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                    {formatMoney(mov.debito)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                    {formatMoney(mov.credito)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                    {formatMoney(mov.balance)}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

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

// Wrapper para los campos para alineación consistente
const Field = ({ label, children, required = false }) => (
    <div className="flex flex-col space-y-1">
        <label className="text-xs font-semibold text-gray-500 truncate flex items-center">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {children}
    </div>
);

const ClienteForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [statusMessage, setStatusMessage] = useState('');
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        company: '',
        taxId: '',
        phone: '',
        email: '',
        address: '',
        status: 'Active',
        balance: 0,
        tipoNCF: '',
        nivelPrecio: '',
        moneda: ''
    });
    // Hold the client configuration (auto‑sequence settings)
    const [clientConfig, setClientConfig] = useState(null);
    const [sellers, setSellers] = useState([]);
    const [ncfTypes, setNcfTypes] = useState([]);
    const [priceLevels, setPriceLevels] = useState([]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Fetch Configuration
                const configRes = await fetch('http://localhost:5006/api/ClientConfiguration');
                if (configRes.ok) {
                    const config = await configRes.json();
                    setClientConfig(config);

                    // If creating new client and auto‑sequence is enabled
                    if (!id && config.useAutoSequence) {
                        // Generate preview code locally based on config
                        const numberPart = String(config.currentValue).padStart(config.sequenceLength, '0');
                        const nextCode = config.useInitials
                            ? `${config.initials}${config.separator}${numberPart}`
                            : numberPart;
                        setFormData(prev => ({ ...prev, code: nextCode }));
                    }
                }

                // Fetch Sellers
                const sellersRes = await fetch('http://localhost:5006/api/Sellers');
                if (sellersRes.ok) {
                    const sellersData = await sellersRes.json();
                    setSellers(sellersData);
                }

                // Fetch NCF Types
                const ncfRes = await fetch('http://localhost:5006/api/Ventas/NCF/Sequences');
                if (ncfRes.ok) {
                    const ncfData = await ncfRes.json();
                    setNcfTypes(ncfData);
                }

                // Fetch Price Levels
                try {
                    const levels = await getNivelesPrecio();
                    setPriceLevels(levels);
                } catch (e) {
                    console.error("Error fetching price levels", e);
                }
            } catch (error) {
                console.error('Error loading initial data:', error);
            }
        };

        loadInitialData();
    }, [id]); // Depend on ID to re-run if navigating between new/edit (though usually component remounts)

    useEffect(() => {
        if (id) {
            fetchClientData(id);
        }
    }, [id]);

    const fetchClientData = async (clientId) => {
        try {
            const response = await fetch(`http://localhost:5006/api/Clients/${clientId}`);
            if (response.ok) {
                const data = await response.json();
                setFormData(data);
            } else {
                console.error('Failed to fetch client');
                alert('No se pudo cargar el cliente');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    // Helper to format name according to configuration
    const formatName = (name) => {
        if (!clientConfig || !clientConfig.nameCase) return name;
        switch (clientConfig.nameCase) {
            case 'words':
                return name
                    .split(' ')
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                    .join(' ');
            case 'first':
                return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
            case 'normal':
            default:
                return name;
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;
        if (name === 'name') {
            newValue = formatName(value);
        }
        setFormData(prev => ({
            ...prev,
            [name]: newValue,
        }));
    };

    const handleSave = async () => {
        try {
            // Basic validation
            if (!formData.name) {
                alert('El nombre es obligatorio');
                return;
            }

            const method = id ? 'PUT' : 'POST';
            const url = id
                ? `http://localhost:5006/api/Clients/${id}`
                : 'http://localhost:5006/api/Clients';

            const dataToSend = {
                ...formData,
                code: formData.code || `C${Math.floor(Math.random() * 10000)}`
            };

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
            });

            if (response.ok) {
                setStatusMessage(id ? 'Cliente actualizado correctamente.' : 'El cliente se ha registrado correctamente.');

                if (!id) {
                    // After creating a new client, fetch updated configuration to generate next code
                    const configRes = await fetch('http://localhost:5006/api/ClientConfiguration');
                    if (configRes.ok) {
                        const config = await configRes.json();
                        const numberPart = String(config.currentValue).padStart(config.sequenceLength, '0');
                        const nextCode = config.useInitials
                            ? `${config.initials}${config.separator}${numberPart}`
                            : numberPart;
                        // Reset form for next entry, keep the new auto‑generated code
                        setFormData({
                            code: nextCode,
                            name: '',
                            company: '',
                            taxId: '',
                            phone: '',
                            email: '',
                            address: '',
                            status: 'Active',
                            balance: 0,
                            tipoNCF: '',
                            nivelPrecio: ''
                        });
                    }
                }
            } else {
                console.error('Error saving client');
                alert('Error al guardar');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 min-h-screen">
            {/* Business Central Style Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')} className="text-gray-500 hover:text-gray-800">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 font-medium">Clientes</span>
                            <span className="text-gray-400 text-xs">/</span>
                            <span className="text-sm text-gray-800 font-bold">Nuevo Cliente</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">Tarjeta de Cliente</h1>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    {statusMessage && (
                        <span className="text-lg font-bold text-blue-400 animate-pulse">
                            {statusMessage}
                        </span>
                    )}

                    <div className="flex items-center space-x-2">
                        <Button variant="ghost" className="text-gray-600 hover:bg-gray-100">
                            <span className="text-xs font-medium">Reportes</span>
                        </Button>
                        <Button variant="ghost" className="text-gray-600 hover:bg-gray-100">
                            <span className="text-xs font-medium">Movimientos</span>
                        </Button>
                        <div className="h-4 w-px bg-gray-300 mx-2"></div>
                        <Button variant="outline" size="sm" onClick={() => navigate('/clientes')} className="border-gray-300 text-gray-700">
                            <X className="mr-2 h-4 w-4" /> Cancelar
                        </Button>
                        <Button size="sm" onClick={handleSave} className="bg-hd-orange hover:bg-orange-600 text-white shadow-sm border border-transparent">
                            <Save className="mr-2 h-4 w-4" /> Guardar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-6 max-w-7xl mx-auto w-full">

                <Section title="Información General">
                    <Field label="No.">
                        <Input
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            placeholder="(Auto)"
                            className="bg-gray-50 border-gray-300 text-gray-900 font-bold"
                            readOnly={clientConfig?.useAutoSequence || !!id}
                        />
                    </Field>
                    <Field label="Nombre" required>
                        <Input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Nombre del cliente"
                            className="font-medium"
                        />
                    </Field>
                    <Field label="Saldo Consolidado (RD$)">
                        <Input
                            value={formData.balance}
                            onChange={() => { }}
                            placeholder="0.00"
                            className="text-right text-hd-orange font-black border-gray-300 text-lg"
                            readOnly
                        />
                    </Field>
                    <Field label="Límite Crédito (RD$)">
                        <Input type="number" placeholder="0.00" className="text-right" readOnly />
                    </Field>
                    <Field label="Vendedor">
                        <select
                            name="sellerName"
                            value={formData.sellerName || ""}
                            onChange={handleChange}
                            className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-hd-orange focus:border-hd-orange"
                        >
                            <option value="">Seleccionar...</option>
                            {sellers.map((seller) => (
                                <option key={seller.id} value={seller.name} className="text-gray-900">
                                    {seller.code} - {seller.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Bloqueado">
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-hd-orange focus:border-hd-orange"
                        >
                            <option value="Active">No</option>
                            <option value="Blocked">Todo</option>
                        </select>
                    </Field>
                </Section>

                <Section title="Dirección y Contacto" defaultExpanded={true}>
                    <Field label="Dirección" required>
                        <Input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Calle, número..."
                        />
                    </Field>
                    <Field label="Dirección 2">
                        <Input placeholder="Apartamento, local..." readOnly />
                    </Field>
                    <Field label="Ciudad">
                        <Input placeholder="Santo Domingo" readOnly />
                    </Field>
                    <Field label="Código Postal">
                        <Input placeholder="10101" readOnly />
                    </Field>
                    <Field label="Teléfono">
                        <Input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="(809) 000-0000"
                        />
                    </Field>
                    <Field label="Correo Electrónico">
                        <Input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="cliente@ejemplo.com"
                            className="text-blue-600 underline"
                        />
                    </Field>
                    <Field label="Página Web">
                        <Input placeholder="www.ejemplo.com" readOnly />
                    </Field>
                    <Field label="Contacto Principal">
                        <Input placeholder="Nombre del contacto" readOnly />
                    </Field>
                </Section>

                <Section title="Facturación" defaultExpanded={false}>
                    <Field label="RNC / Cédula" required>
                        <Input
                            name="taxId"
                            value={formData.taxId}
                            onChange={handleChange}
                            placeholder="001-0000000-0"
                        />
                    </Field>
                    <Field label="Condición Pago">
                        <select className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-hd-orange focus:border-hd-orange">
                            <option>Contado</option>
                            <option>15 Días</option>
                            <option>30 Días</option>
                            <option>60 Días</option>
                        </select>
                    </Field>
                    <Field label="Nivel de Precio">
                        <select
                            name="nivelPrecio"
                            value={formData.nivelPrecio || ""}
                            onChange={handleChange}
                            className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-hd-orange focus:border-hd-orange"
                        >
                            <option value="">-- Predeterminado --</option>
                            {priceLevels.map((lvl) => (
                                <option key={lvl.id} value={lvl.nombre}>
                                    {lvl.nombre}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Tipo NCF">
                        <select
                            name="tipoNCF"
                            value={formData.tipoNCF || ""}
                            onChange={handleChange}
                            className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-hd-orange focus:border-hd-orange"
                        >
                            <option value="">Seleccionar...</option>
                            {ncfTypes.map((ncf) => (
                                <option key={ncf.id} value={ncf.tipoNCF}>
                                    {ncf.nombre} ({ncf.tipoNCF})
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Moneda">
                        <select
                            name="moneda"
                            value={formData.moneda || ""}
                            onChange={handleChange}
                            className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-hd-orange focus:border-hd-orange"
                        >
                            <option value="">Seleccionar...</option>
                            <option value="DOP">DOP</option>
                            <option value="USD">USD</option>
                        </select>
                    </Field>
                    <Field label="Grupo Impuesto">
                        <select className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-hd-orange focus:border-hd-orange" disabled>
                            <option>ITBIS 18%</option>
                            <option>Exento</option>
                        </select>
                    </Field>
                    <Field label="Compañía">
                        <Input
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            placeholder="Nombre de empresa..."
                        />
                    </Field>
                </Section>

                <Section title="Estado de Cuenta" defaultExpanded={true}>
                    <div className="col-span-full">
                        <ClientLedger clientId={id} />
                    </div>
                </Section>
            </div>
        </div>
    );
};

export default ClienteForm;


