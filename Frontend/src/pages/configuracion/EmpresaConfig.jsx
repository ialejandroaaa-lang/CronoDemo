import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

const EmpresaConfig = () => {
    const [config, setConfig] = useState({
        nombreEmpresa: '',
        rnc: '',
        direccion: '',
        telefono: '',
        correo: '',
        sitioWeb: '',
        logoPath: '',
        impuestoDefault: 18,
        monedaPrincipal: 'DOP'
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    const safe = (val) => val === null || val === undefined ? '' : val;

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/CompanyConfiguration`);
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
                if (data.logoPath) {
                    setLogoPreview(`${API_BASE.replace('/api', '')}${data.logoPath}`);
                }
            }
        } catch (e) {
            console.error("Error loading Company config:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setMessage(null);

        try {
            // 1. Upload Logo if changed
            let currentLogoPath = config.logoPath;
            if (logoFile) {
                const formData = new FormData();
                formData.append('file', logoFile);

                const uploadRes = await fetch(`${API_BASE}/CompanyConfiguration/upload-logo`, {
                    method: 'POST',
                    body: formData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    currentLogoPath = uploadData.path;
                    setConfig(prev => ({ ...prev, logoPath: currentLogoPath }));
                }
            }

            // 2. Save Config
            const res = await fetch(`${API_BASE}/CompanyConfiguration`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...config, logoPath: currentLogoPath })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Información de empresa guardada.' });
            } else {
                setMessage({ type: 'error', text: 'Error al guardar información.' });
            }

        } catch (e) {
            console.error(e);
            setMessage({ type: 'error', text: 'Error de conexión.' });
        }

        setTimeout(() => setMessage(null), 3000);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    if (loading) return <div className="p-8 text-center">Cargando datos de empresa...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Configuración de Compañía</h1>

            {message && (
                <div className={`p-4 rounded-md flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} className="bg-white shadow rounded-lg p-6 space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Logo Section */}
                    <div className="md:col-span-1 flex flex-col items-center space-y-4">
                        <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 relative group hover:border-hd-orange transition-colors">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <ImageIcon size={48} className="mx-auto mb-2" />
                                    <span className="text-sm">Sin Logo</span>
                                </div>
                            )}
                            <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Upload size={24} className="mb-1" />
                                <span className="text-xs font-medium">Cambiar Logo</span>
                                <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 text-center">Formato: PNG, JPG (Max 2MB)</p>
                    </div>

                    {/* Form Fields */}
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                            <input
                                type="text"
                                name="nombreEmpresa"
                                value={safe(config.nombreEmpresa)}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring-hd-orange"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">RNC / ID Fiscal</label>
                                <input
                                    type="text"
                                    name="rnc"
                                    value={safe(config.rnc)}
                                    onChange={handleChange}
                                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring-hd-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                                <input
                                    type="text"
                                    name="telefono"
                                    value={safe(config.telefono)}
                                    onChange={handleChange}
                                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring-hd-orange"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Dirección</label>
                            <textarea
                                name="direccion"
                                value={safe(config.direccion)}
                                onChange={handleChange}
                                rows={2}
                                className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring-hd-orange"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                                <input
                                    type="email"
                                    name="correo"
                                    value={safe(config.correo)}
                                    onChange={handleChange}
                                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring-hd-orange"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Sitio Web</label>
                                <input
                                    type="text"
                                    name="sitioWeb"
                                    value={safe(config.sitioWeb)}
                                    onChange={handleChange}
                                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring-hd-orange"
                                />
                            </div>
                        </div>

                        {/* Configuracion Fiscal / Moneda */}
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Moneda Principal</label>
                                <select
                                    name="monedaPrincipal"
                                    value={safe(config.monedaPrincipal)}
                                    onChange={handleChange}
                                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring-hd-orange"
                                >
                                    <option value="DOP">Peso Dominicano (DOP)</option>
                                    <option value="USD">Dólar Estadounidense (USD)</option>
                                    <option value="EUR">Euro (EUR)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Impuesto Default (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="impuestoDefault"
                                    value={safe(config.impuestoDefault)}
                                    onChange={handleChange}
                                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-hd-orange focus:ring-hd-orange"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                    <Button type="submit" className="bg-hd-orange hover:bg-orange-600 text-white flex items-center gap-2">
                        <Save size={18} />
                        Guardar Información
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EmpresaConfig;
