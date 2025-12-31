import React, { useState, useEffect } from 'react';
import {
    Users, Shield, Search, Save, Copy, Trash2,
    ChevronRight, Info, AlertTriangle, CheckCircle2,
    Eye, EyeOff, Slash, Lock, Activity, Check
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

const SecurityEditor = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [catalog, setCatalog] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchGroups();
        fetchCatalog();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            fetchGroupPermissions(selectedGroup.id);
        }
    }, [selectedGroup]);

    const fetchGroups = async () => {
        try {
            const resp = await fetch(`${((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api')}/SecurityEditor/groups`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await resp.json();
            setGroups(data);
            if (data.length > 0 && !selectedGroup) setSelectedGroup(data[0]);
        } catch (err) {
            console.error("Error fetching groups", err);
        }
    };

    const fetchCatalog = async () => {
        try {
            const resp = await fetch(`${((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api')}/SecurityEditor/permissions-catalog`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await resp.json();
            setCatalog(data);
        } catch (err) {
            console.error("Error fetching catalog", err);
        }
    };

    const fetchGroupPermissions = async (groupId) => {
        setLoading(true);
        try {
            const resp = await fetch(`${((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api')}/SecurityEditor/group-permissions/${groupId}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await resp.json();
            setPermissions(data);
        } catch (err) {
            console.error("Error fetching group permissions", err);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePermission = (objectId) => {
        setPermissions(prev => {
            const existing = prev.find(p => p.securityObjectId === objectId);
            if (existing) {
                return prev.map(p => p.securityObjectId === objectId ? { ...p, isAllowed: !p.isAllowed } : p);
            } else {
                return [...prev, { roleId: selectedGroup.id, securityObjectId: objectId, isAllowed: true, uiBehavior: 1 }];
            }
        });
    };

    const handleToggleBehavior = (objectId) => {
        setPermissions(prev => {
            return prev.map(p => p.securityObjectId === objectId ? { ...p, uiBehavior: p.uiBehavior === 0 ? 1 : 0 } : p);
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const resp = await fetch(`${((import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined') ? import.meta.env.VITE_API_URL : '/api')}/SecurityEditor/group-permissions/bulk-update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(permissions.map(p => ({ ...p, roleId: selectedGroup.id })))
            });
            if (resp.ok) {
                setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setMessage({ type: 'error', text: 'Error al guardar los cambios' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error de conexión' });
        } finally {
            setSaving(false);
        }
    };

    const filteredCatalog = catalog.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group catalog by category
    const categories = Array.from(new Set(filteredCatalog.map(i => i.category)));

    return (
        <div className="p-8 bg-[var(--bg-main)] min-h-screen text-[var(--text-main)] transition-colors duration-500 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 border-b border-[var(--border-color)] pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3 text-[var(--text-main)]">
                        <div className="p-2.5 bg-hd-orange/10 rounded-xl">
                            <Shield size={28} className="text-hd-orange" />
                        </div>
                        Editor de Seguridad
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm font-medium mt-1 ml-1 pl-14 flex items-center gap-2 opacity-80">
                        <Activity size={14} className="text-hd-orange" />
                        Control de acceso basado en roles (RBAC)
                    </p>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                    {message.text && (
                        <div className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 animate-in slide-in-from-right duration-300 shadow-sm ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
                            }`}>
                            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                            {message.text}
                        </div>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={saving || !selectedGroup}
                        className="bg-hd-orange hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-hd-orange/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
                        <span className="hidden sm:inline">Guardar Cambios</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Panel: Security Groups */}
                <div className="lg:col-span-3 lg:col-start-1 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-6 flex flex-col shadow-sm h-[calc(100vh-250px)] sticky top-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Roles de Sistema</h2>
                        <div className="p-1.5 bg-[var(--bg-main)] rounded-lg text-hd-orange">
                            <Users size={16} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {groups.map(group => (
                            <button
                                key={group.id}
                                onClick={() => setSelectedGroup(group)}
                                className={`w-full text-left p-4 rounded-2xl transition-all border flex items-center justify-between group relative overflow-hidden ${selectedGroup?.id === group.id
                                    ? 'bg-hd-orange border-hd-orange shadow-lg shadow-hd-orange/20 text-white'
                                    : 'bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-main)]/80 hover:border-hd-orange/30 hover:text-[var(--text-main)]'
                                    }`}
                            >
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className={`p-2 rounded-xl ${selectedGroup?.id === group.id ? 'bg-white/20' : 'bg-[var(--bg-card)] shadow-sm'} transition-colors`}>
                                        <Lock size={16} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold uppercase tracking-wider">{group.name}</span>
                                        <span className={`text-[10px] ${selectedGroup?.id === group.id ? 'text-white/80' : 'text-[var(--text-muted)]'} font-medium mt-0.5 truncate max-w-[120px]`}>
                                            {group.description || 'Sin descripción'}
                                        </span>
                                    </div>
                                </div>
                                {selectedGroup?.id === group.id && (
                                    <ChevronRight size={16} className="text-white/80" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Permission Matrix */}
                <div className="lg:col-span-9 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-8 flex flex-col shadow-sm h-[calc(100vh-250px)]">
                    {/* Filter Bar */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                        <div className="relative flex-1 group w-full">
                            <div className="absolute inset-0 bg-hd-orange/5 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-hd-orange transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar permiso, código o categoría..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl py-4 pl-14 pr-6 text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-hd-orange/20 focus:border-hd-orange/50 transition-all shadow-sm relative z-10"
                            />
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)]">
                            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Permisos:</span>
                            <span className="text-lg font-bold text-hd-orange">{filteredCatalog.length}</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-10">
                        {categories.map(cat => (
                            <div key={cat} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-4 mb-5">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-hd-orange flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-hd-orange"></div>
                                        {cat}
                                    </h3>
                                    <div className="flex-1 h-px bg-gradient-to-r from-[var(--border-color)] to-transparent"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                                    {filteredCatalog.filter(i => i.category === cat).map(item => {
                                        const perm = permissions.find(p => p.securityObjectId === item.id);
                                        const isAllowed = perm?.isAllowed || false;
                                        const behavior = perm?.uiBehavior ?? 1; // 0=hide, 1=disable

                                        return (
                                            <div key={item.id} className={`group p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${isAllowed
                                                ? 'bg-gradient-to-br from-[var(--bg-main)] to-[var(--bg-card)] border-hd-orange/30 shadow-md shadow-hd-orange/5'
                                                : 'bg-[var(--bg-main)] border-[var(--border-color)] opacity-70 hover:opacity-100 hover:border-[var(--border-color)]/80'
                                                }`}>

                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-start gap-4">
                                                        {/* Custom Checkbox */}
                                                        <button
                                                            onClick={() => handleTogglePermission(item.id)}
                                                            className={`mt-1 min-w-[24px] h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${isAllowed
                                                                ? 'bg-hd-orange border-hd-orange text-white shadow-sm scale-110'
                                                                : 'border-[var(--text-muted)]/30 text-transparent hover:border-hd-orange/50'
                                                                }`}
                                                        >
                                                            <Check size={16} strokeWidth={4} />
                                                        </button>

                                                        <div>
                                                            <h4 className={`text-sm font-bold leading-tight ${isAllowed ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                                                                {item.name}
                                                            </h4>
                                                            <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] uppercase">
                                                                {item.code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-[var(--text-muted)] leading-relaxed pl-10 mb-4 opacity-80">
                                                    {item.description}
                                                </p>

                                                {/* Behavior Controls - Only visible when allowed */}
                                                <div className={`pl-10 flex items-center gap-2 transition-all duration-300 ${isAllowed ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                                                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mr-2">Si denegado:</span>

                                                    <button
                                                        onClick={() => isAllowed && handleToggleBehavior(item.id)}
                                                        disabled={!isAllowed}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${behavior === 0
                                                            ? 'bg-zinc-800 text-white border-zinc-900'
                                                            : 'bg-transparent text-[var(--text-muted)] border-transparent hover:bg-[var(--bg-card)]'
                                                            }`}
                                                        title="El elemento desaparece de la UI"
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <EyeOff size={12} /> Ocultar
                                                        </div>
                                                    </button>

                                                    <button
                                                        onClick={() => isAllowed && handleToggleBehavior(item.id)}
                                                        disabled={!isAllowed}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${behavior === 1
                                                            ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-gray-100 border-zinc-300 dark:border-zinc-600'
                                                            : 'bg-transparent text-[var(--text-muted)] border-transparent hover:bg-[var(--bg-card)]'
                                                            }`}
                                                        title="El elemento se ve pero no se puede usar"
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <Slash size={12} /> Inactivar
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityEditor;


