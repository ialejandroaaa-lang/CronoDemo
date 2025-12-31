import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { getConfig, saveConfig, getSecuencias, saveSecuencias } from '../../api/articuloConfig';
import { getPlanes, getPlan } from '../../api/unidadMedida';
import { getGruposProducto } from '../../api/gruposProducto';
import { Search } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

const ArticuloConfig = () => {
    const navigate = useNavigate();
    const [headerContainer, setHeaderContainer] = useState(null);
    const [messageContainer, setMessageContainer] = useState(null);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        setHeaderContainer(document.getElementById('header-actions'));
        setMessageContainer(document.getElementById('header-message'));
    }, []);

    const [config, setConfig] = useState({
        usarSecuenciaPorGrupo: true, // Default to true as per new feature
        prefijo: '',
        siguienteNumero: '00001',
        longitudMinima: 5,
        permitirEdicion: false,
        requiereCodBarras: false,
        activarPorDefecto: true,
        categoriaDefecto: '',
        rutaImagenesDefecto: ''
    });
    const [planesUoM, setPlanesUoM] = useState([]);
    const [gruposList, setGruposList] = useState([]);

    const [loading, setLoading] = useState(false);

    const [secuenciasPorGrupo, setSecuenciasPorGrupo] = useState([
        { id: 1, grupo: 'Profesional', prefijo: 'PROF-', siguienteNumero: '00001', longitudMinima: 5, activo: true },
        { id: 2, grupo: 'Industrial', prefijo: 'IND-', siguienteNumero: '00001', longitudMinima: 5, activo: true },
        { id: 3, grupo: 'Hogar', prefijo: 'HOG-', siguienteNumero: '00001', longitudMinima: 5, activo: true },
        { id: 4, grupo: 'Comercial', prefijo: 'COM-', siguienteNumero: '00001', longitudMinima: 5, activo: false },
    ]);
    const [browsing, setBrowsing] = useState(false);

    const handleChange = (campo, valor) => {
        setConfig(prev => {
            const newConfig = { ...prev, [campo]: valor };

            if (campo === 'prefijo' || campo === 'longitudMinima') {
                const numero = '1'.padStart(newConfig.longitudMinima, '0');
                newConfig.formatoEjemplo = `${newConfig.prefijo}${numero}`;
            }

            return newConfig;
        });
    };

    const handleGrupoChange = (id, campo, valor) => {
        setSecuenciasPorGrupo(prev =>
            prev.map(s => {
                if (s.id !== id) return s;
                const updated = { ...s, [campo]: valor };

                // If Plan changes, auto-set Base UoM
                if (campo === 'planDefecto') {
                    if (valor) {
                        const plan = planesUoM.find(p => p.planId === valor);
                        if (plan) updated.unidadMedidaDefecto = plan.unidadBase;
                    } else {
                        updated.unidadMedidaDefecto = '';
                    }
                }

                return updated;
            })
        );
    };

    const handleAgregarGrupo = () => {
        const nuevoGrupo = {
            id: null,
            grupo: '',
            prefijo: '',
            siguienteNumero: '00001',
            longitudMinima: 5,
            activo: true,
            esDefecto: false,
            planDefecto: '',
            unidadMedidaDefecto: ''
        };
        setSecuenciasPorGrupo([...secuenciasPorGrupo, nuevoGrupo]);
    };

    const handleSetDefaultGroup = (id) => {
        setSecuenciasPorGrupo(secuenciasPorGrupo.map(s => ({
            ...s,
            esDefecto: s.id === id
        })));
    };

    const handleEliminarGrupo = (id) => {
        setSecuenciasPorGrupo(secuenciasPorGrupo.filter(s => s.id !== id));
    };

    const loadConfig = async () => {
        setLoading(true);
        try {
            const data = await getConfig();
            setConfig(data);


        } catch (error) {
            console.error('Error loading config:', error);
            alert('No se pudo cargar la configuración');
        } finally {
            setLoading(false);
        }
    };

    const loadSecuencias = async () => {
        try {
            const seq = await getSecuencias();
            const mapped = seq.map(s => ({
                id: s.id,
                grupo: s.grupo,
                prefijo: s.prefijo || '',
                siguienteNumero: s.siguienteNumero || '',
                longitudMinima: s.longitudMinima,
                activo: s.activo,
                esDefecto: s.esDefecto || false,
                planDefecto: s.planDefecto || '',
                unidadMedidaDefecto: s.unidadMedidaDefecto || ''
            }));
            setSecuenciasPorGrupo(mapped);
        } catch (err) {
            console.error('Error loading sequences:', err);
            alert('No se pudieron cargar las secuencias');
        }
    };

    // Initial Load
    useEffect(() => {
        const loadAll = async () => {
            // Load Planes first
            try {
                const planes = await getPlanes();
                setPlanesUoM(planes);
            } catch (e) { console.error(e); }

            try {
                const groups = await getGruposProducto();
                setGruposList(groups);
            } catch (e) {
                console.error("Error loading groups in config", e);
            }

            await loadConfig();
            loadSecuencias();
        };
        loadAll();
    }, []);

    const handleNativeBrowse = async () => {
        if (browsing) return;
        setBrowsing(true);
        try {
            const res = await fetch(`${API_BASE}/FileSystem/NativeBrowse`);
            if (res.status === 200) {
                const data = await res.json();
                if (data.path) {
                    handleChange('rutaImagenesDefecto', data.path);
                }
            } else if (res.status === 204) {
                console.log('User cancelled the dialog');
            } else if (res.status === 408) {
                alert('Tiempo de espera agotado. Por favor, intente de nuevo.');
            } else {
                const err = await res.json();
                alert('Error: ' + err.message);
            }
        } catch (error) {
            console.error('Error opening native explorer:', error);
            alert('No se pudo abrir el explorador del sistema');
        } finally {
            setBrowsing(false);
        }
    };


    const handleSave = async () => {
        // Validate groups
        const gruposInvalidos = secuenciasPorGrupo.filter(s => !s.grupo || s.grupo.trim() === '');
        if (gruposInvalidos.length > 0) {
            alert('No se pueden guardar grupos sin nombre. Por favor, asigne un nombre a todos los grupos o elimínelos.');
            return;
        }

        const nombresGrupos = secuenciasPorGrupo.map(s => s.grupo.trim().toLowerCase());
        const duplicados = nombresGrupos.filter((item, idx) => nombresGrupos.indexOf(item) !== idx);
        if (duplicados.length > 0) {
            alert('Existen grupos con nombres duplicados. Cada grupo debe ser único.');
            return;
        }

        try {
            await saveConfig(config);
            await saveSecuencias(secuenciasPorGrupo);
            setSaveMessage('Cambios guardados correctamente');
            // Clear message after 3 seconds
            setTimeout(() => setSaveMessage(''), 3000);

            // Reload to get properly formatted data from backend (optional but good practice)
            // Reload to get properly formatted data from backend
            await loadSecuencias();

        } catch (error) {
            console.error('Error al guardar:', error);
            alert('Error al guardar la configuración');
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {headerContainer && createPortal(
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => navigate('/configuracion')} className="mr-2">
                        <span className="text-gray-600">Cancelar</span>
                    </Button>
                    <Button className="bg-hd-orange hover:bg-orange-600" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios
                    </Button>
                </div>,
                headerContainer
            )}

            {messageContainer && saveMessage && createPortal(
                <div className="text-green-600 text-sm font-medium">
                    {saveMessage}
                </div>,
                messageContainer
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Secuencia Numérica General</CardTitle>
                </CardHeader>
                <div className="p-6 space-y-6">
                    <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <input
                            type="checkbox"
                            id="usarSecuenciaPorGrupo"
                            checked={config.usarSecuenciaPorGrupo}
                            onChange={(e) => handleChange('usarSecuenciaPorGrupo', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-hd-orange focus:ring-hd-orange"
                        />
                        <div className="flex-1">
                            <label htmlFor="usarSecuenciaPorGrupo" className="text-sm font-semibold text-blue-900">
                                Usar Secuencia por Grupo de Producto
                            </label>
                            <p className="text-xs text-blue-700 mt-1">
                                Cada grupo de producto tendrá su propia secuencia numérica independiente
                            </p>
                        </div>
                    </div>

                    {!config.usarSecuenciaPorGrupo && (
                        <>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Prefijo</label>
                                    <Input
                                        value={config.prefijo}
                                        onChange={(e) => handleChange('prefijo', e.target.value)}
                                        placeholder="Ej: ART-, PROD-, ITM-"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Prefijo que se agregará antes del número de artículo
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Siguiente Número</label>
                                    <Input
                                        value={config.siguienteNumero}
                                        onChange={(e) => handleChange('siguienteNumero', e.target.value)}
                                        placeholder="00001"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Próximo número que se asignará a un nuevo artículo
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Longitud Mínima</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={config.longitudMinima}
                                        onChange={(e) => handleChange('longitudMinima', parseInt(e.target.value))}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Cantidad de dígitos mínimos (se rellenará con ceros a la izquierda)
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Formato de Ejemplo</label>
                                    <div className="h-10 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md flex items-center">
                                        <span className="font-mono text-sm font-semibold text-gray-700">
                                            {config.formatoEjemplo}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Vista previa del formato del número de artículo
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="pt-4 border-t">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="permitirEdicion"
                                checked={config.permitirEdicion}
                                onChange={(e) => handleChange('permitirEdicion', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-hd-orange focus:ring-hd-orange"
                            />
                            <label htmlFor="permitirEdicion" className="text-sm font-medium text-gray-700">
                                Permitir edición manual del número de artículo
                            </label>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Secuencias por Grupo de Producto */}
            {
                config.usarSecuenciaPorGrupo && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Secuencias por Grupo de Producto</CardTitle>
                                <Button variant="outline" size="sm" onClick={handleAgregarGrupo}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Agregar Grupo
                                </Button>
                            </div>
                        </CardHeader>
                        <div className="p-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12 text-center text-xs text-gray-500">Activo</TableHead>
                                        <TableHead className="w-20 text-center text-xs font-bold text-blue-600">Por Defecto</TableHead>
                                        <TableHead>Grupo de Producto</TableHead>
                                        <TableHead className="w-24">Plan Def.</TableHead>
                                        <TableHead className="w-20">U.M. Def.</TableHead>
                                        <TableHead className="w-32">Prefijo</TableHead>
                                        <TableHead className="w-32">Siguiente #</TableHead>
                                        <TableHead className="w-24">Longitud</TableHead>
                                        <TableHead className="w-48">Ejemplo</TableHead>
                                        <TableHead className="w-16"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {secuenciasPorGrupo.map((sec) => (
                                        <TableRow key={sec.id}>
                                            <TableCell className="text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={sec.activo}
                                                    onChange={(e) => handleGrupoChange(sec.id, 'activo', e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-300 text-hd-orange focus:ring-hd-orange"
                                                    title="Activar/Desactivar grupo"
                                                />
                                            </TableCell>
                                            <TableCell className="text-center bg-blue-50/50">
                                                <input
                                                    type="radio"
                                                    name="defaultGroup"
                                                    checked={sec.esDefecto}
                                                    onChange={() => handleSetDefaultGroup(sec.id)}
                                                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    title="Marcar como grupo por defecto"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <select
                                                    value={sec.grupo}
                                                    onChange={(e) => handleGrupoChange(sec.id, 'grupo', e.target.value)}
                                                    className="w-full h-8 px-2 text-sm border border-gray-300 rounded focus:ring-hd-orange focus:border-hd-orange bg-white"
                                                >
                                                    <option value="">Seleccione Grupo</option>
                                                    {gruposList.map((g) => (
                                                        <option key={g.id} value={g.nombre}>{g.nombre}</option>
                                                    ))}
                                                    {sec.grupo && !gruposList.some(g => g.nombre === sec.grupo) && (
                                                        <option value={sec.grupo}>{sec.grupo} (Legacy)</option>
                                                    )}
                                                </select>
                                            </TableCell>
                                            <TableCell>
                                                <select
                                                    value={sec.planDefecto || ''}
                                                    onChange={(e) => handleGrupoChange(sec.id, 'planDefecto', e.target.value)}
                                                    className="w-full text-xs border-0 bg-transparent p-1 h-8 focus:ring-0"
                                                >
                                                    <option value="">--</option>
                                                    {planesUoM.map((p, idx) => (
                                                        <option key={idx} value={p.planId}>{p.planId}</option>
                                                    ))}
                                                </select>
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const plan = planesUoM.find(p => p.planId === sec.planDefecto);
                                                    if (sec.planDefecto && !plan) console.warn("Plan not found:", sec.planDefecto);
                                                    if (plan) console.log("Plan UoMs:", plan);

                                                    const units = plan
                                                        ? [plan.unidadBase, ...(plan.detalles ? plan.detalles.map(d => d.unidadMedida) : [])]
                                                        : [];

                                                    // Filter duplicates
                                                    const uniqueUnits = [...new Set(units)];

                                                    return (
                                                        <select
                                                            value={sec.unidadMedidaDefecto || ''}
                                                            onChange={(e) => handleGrupoChange(sec.id, 'unidadMedidaDefecto', e.target.value)}
                                                            className="w-full text-xs border-0 bg-transparent p-1 h-8 focus:ring-0"
                                                            disabled={!sec.planDefecto}
                                                            title={!sec.planDefecto ? "Seleccione un plan primero" : "Unidad por defecto"}
                                                        >
                                                            {uniqueUnits.length === 0 && <option value="">--</option>}
                                                            {uniqueUnits.map((u, i) => (
                                                                <option key={i} value={u}>{u}</option>
                                                            ))}
                                                        </select>
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={sec.prefijo}
                                                    onChange={(e) => handleGrupoChange(sec.id, 'prefijo', e.target.value)}
                                                    placeholder="PROF-"
                                                    className="border-0 bg-transparent p-1 h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={sec.siguienteNumero}
                                                    onChange={(e) => handleGrupoChange(sec.id, 'siguienteNumero', e.target.value)}
                                                    placeholder="00001"
                                                    className="border-0 bg-transparent p-1 h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={sec.longitudMinima}
                                                    onChange={(e) => handleGrupoChange(sec.id, 'longitudMinima', parseInt(e.target.value))}
                                                    className="border-0 bg-transparent p-1 h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono text-sm font-semibold text-gray-700">
                                                    {sec.prefijo}{String(1).padStart(sec.longitudMinima, '0')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                                                    onClick={() => handleEliminarGrupo(sec.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Importante</h4>
                                <p className="text-xs text-yellow-800">
                                    Al crear un artículo, el sistema usará la secuencia del grupo de producto seleccionado.
                                    Asegúrese de que cada grupo tenga una secuencia configurada.
                                </p>
                            </div>
                        </div>
                    </Card>
                )
            }

            {/* Configuración Adicional */}
            <Card>
                <CardHeader>
                    <CardTitle>Configuración Adicional</CardTitle>
                </CardHeader>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Categoría por Defecto
                            </label>
                            <select
                                value={config.categoriaDefecto || ''}
                                onChange={(e) => handleChange('categoriaDefecto', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hd-orange"
                            >
                                <option value="">Sin categoría</option>
                                <option>Herramientas Manuales</option>
                                <option>Herramientas Eléctricas</option>
                                <option>Plomería</option>
                                <option>Electricidad</option>
                                <option>Pintura</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Categoría que se asignará por defecto a nuevos artículos
                            </p>
                        </div>


                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="requiereCodBarras"
                            checked={config.requiereCodBarras}
                            onChange={(e) => handleChange('requiereCodBarras', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-hd-orange focus:ring-hd-orange"
                        />
                        <label htmlFor="requiereCodBarras" className="text-sm font-medium text-gray-700">
                            Requerir código de barras al crear artículo
                        </label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="activarPorDefecto"
                            checked={config.activarPorDefecto}
                            onChange={(e) => handleChange('activarPorDefecto', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-hd-orange focus:ring-hd-orange"
                        />
                        <label htmlFor="activarPorDefecto" className="text-sm font-medium text-gray-700">
                            Activar artículos por defecto al crearlos
                        </label>
                    </div>

                    <div className="pt-4 border-t">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Ruta por Defecto para Imágenes de Productos
                        </label>
                        <div className="flex gap-2">
                            <Input
                                value={config.rutaImagenesDefecto || ''}
                                onChange={(e) => handleChange('rutaImagenesDefecto', e.target.value)}
                                placeholder="Ej: C:\POS\Imagenes\Productos"
                                className="flex-1"
                            />
                            <Button
                                variant="outline"
                                onClick={handleNativeBrowse}
                                title="Explorar carpetas"
                                disabled={browsing}
                            >
                                <Search className={`h-4 w-4 mr-2 ${browsing ? 'animate-spin' : ''}`} />
                                {browsing ? 'Abriendo...' : 'Explorar'}
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Directorio en el servidor donde se almacenarán las fotos de los artículos.
                        </p>
                    </div>
                </div>
            </Card>
        </div >
    );
};

export default ArticuloConfig;
