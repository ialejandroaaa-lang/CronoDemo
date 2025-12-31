import React, { useState, useEffect } from 'react';
import {
    Users, UserPlus, Search, Edit2, Trash2,
    Shield, Mail, Activity, ChevronRight,
    CheckCircle2, XCircle, Key, RefreshCw
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

const UsuariosList = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        userName: '',
        fullName: '',
        email: '',
        password: '',
        role: 'CAJEROS',
        isActive: true
    });
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersResp, groupsResp] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL || '/api'}/SecurityEditor/users`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                }),
                fetch(`${import.meta.env.VITE_API_URL || '/api'}/SecurityEditor/groups`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                })
            ]);

            if (usersResp.ok && groupsResp.ok) {
                const usersData = await usersResp.json();
                const groupsData = await groupsResp.json();
                setUsers(usersData);
                setGroups(groupsData);
            }
        } catch (err) {
            console.error("Error fetching data", err);
            setMessage({ type: 'error', text: 'Error al conectar con el servidor' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (u = null) => {
        if (u) {
            setSelectedUser(u);
            setFormData({
                userName: u.userName,
                fullName: u.fullName || '',
                email: u.email || '',
                password: '', // Hidden for edit
                role: 'CAJEROS', // Default, ideally fetch from u.roles if available
                isActive: u.isActive
            });
        } else {
            setSelectedUser(null);
            setFormData({
                userName: '',
                fullName: '',
                email: '',
                password: '',
                role: 'CAJEROS',
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = selectedUser
                ? `${import.meta.env.VITE_API_URL || '/api'}/SecurityEditor/users/${selectedUser.id}`
                : `${import.meta.env.VITE_API_URL || '/api'}/SecurityEditor/users`;

            const method = selectedUser ? 'PUT' : 'POST';

            const resp = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(formData)
            });

            if (resp.ok) {
                setMessage({ type: 'success', text: `Usuario ${selectedUser ? 'actualizado' : 'creado'} correctamente` });
                setIsModalOpen(false);
                fetchData();
            } else {
                const error = await resp.json();
                setMessage({ type: 'error', text: Array.isArray(error) ? error[0].description : 'Error al guardar usuario' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error de conexión' });
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword) return;
        setSaving(true);
        try {
            const resp = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/SecurityEditor/users/${selectedUser.id}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ newPassword })
            });

            if (resp.ok) {
                setMessage({ type: 'success', text: 'Contraseña actualizada' });
                setIsResetModalOpen(false);
                setNewPassword('');
            } else {
                setMessage({ type: 'error', text: 'Error al resetear contraseña' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error de conexión' });
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.fullName && u.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-8 bg-[var(--bg-main)] min-h-screen text-[var(--text-main)] transition-colors duration-500 font-sans">
            {/* Header with improved layout */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3 text-[var(--text-main)]">
                        <div className="p-2.5 bg-hd-orange/10 rounded-xl">
                            <Users size={28} className="text-hd-orange" />
                        </div>
                        Directorio de Usuarios
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm font-medium mt-1 ml-1 pl-14 flex items-center gap-2 opacity-80">
                        Gestión de accesos y seguridad
                    </p>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                    <Button
                        onClick={fetchData}
                        className="p-3 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)] transition-all"
                        title="Recargar datos"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </Button>
                    <Button
                        onClick={() => handleOpenModal()}
                        className="bg-hd-orange hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-hd-orange/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <UserPlus size={18} />
                        <span className="hidden sm:inline">Nuevo Usuario</span>
                    </Button>
                </div>
            </div>

            {/* Notifications */}
            {message.text && (
                <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 border animate-in slide-in-from-top-2 duration-300 ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'}`}>
                    {message.type === 'error' ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
                    <span className="font-semibold text-sm">{message.text}</span>
                    <button onClick={() => setMessage({ type: '', text: '' })} className="ml-auto hover:bg-black/5 p-1 rounded-full transition-colors">
                        <XCircle size={16} className="opacity-50" />
                    </button>
                </div>
            )}

            {/* Dashboard Stats & Search - Theme Aware */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                <div className="col-span-12 md:col-span-7 lg:col-span-8">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-hd-orange/5 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-hd-orange transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl py-4 pl-14 pr-6 text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-hd-orange/20 focus:border-hd-orange/50 transition-all shadow-sm relative z-10"
                        />
                    </div>
                </div>
                <div className="col-span-12 md:col-span-5 lg:col-span-4 flex gap-4">
                    <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm hover:border-hd-orange/30 transition-colors">
                        <span className="text-2xl font-bold text-[var(--text-main)] w-full text-center truncate">{users.length}</span>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Registrados</span>
                    </div>
                    <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm hover:border-emerald-500/30 transition-colors">
                        <span className="text-2xl font-bold text-emerald-500 w-full text-center truncate">{users.filter(u => u.isActive).length}</span>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Activos</span>
                    </div>
                </div>
            </div>

            {/* Users Grid - Clean & Premium */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-64 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] animate-pulse"></div>
                    ))
                ) : filteredUsers.map(u => (
                    <div key={u.id} className="bg-[var(--bg-card)] hover:shadow-xl hover:shadow-black/5 border border-[var(--border-color)] rounded-2xl p-6 transition-all duration-300 group relative flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-hd-orange/10 to-transparent rounded-2xl flex items-center justify-center text-hd-orange font-bold text-xl shadow-inner border border-hd-orange/5 group-hover:scale-110 transition-transform duration-300">
                                    {u.userName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-[var(--text-main)] leading-tight truncate max-w-[140px]">{u.fullName || u.userName}</h3>
                                    <p className="text-xs text-[var(--text-muted)] font-mono mt-1 opacity-75">@{u.userName}</p>
                                </div>
                            </div>
                            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${u.isActive ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' : 'bg-red-500/5 text-red-600 border-red-500/20'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                {u.isActive ? 'Activo' : 'Inactivo'}
                            </div>
                        </div>

                        <div className="space-y-3 mb-6 bg-[var(--bg-main)]/50 p-4 rounded-xl border border-[var(--border-color)]/50">
                            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                                <Shield size={14} className="text-hd-orange opacity-70" />
                                <span className="font-semibold uppercase tracking-wide">Acceso Total</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                                <Mail size={14} className="text-hd-orange opacity-70" />
                                <span className="truncate">{u.email || 'Sin correo asociado'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2 mt-auto">
                            <button
                                onClick={() => handleOpenModal(u)}
                                className="flex-1 py-2.5 rounded-xl bg-[var(--bg-main)] hover:bg-hd-orange hover:text-white text-[var(--text-main)] font-semibold text-xs uppercase tracking-wider transition-all border border-[var(--border-color)] hover:border-hd-orange hover:shadow-md flex items-center justify-center gap-2 group/btn"
                            >
                                <Edit2 size={14} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                                Editar
                            </button>
                            <button
                                onClick={() => { setSelectedUser(u); setIsResetModalOpen(true); }}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-main)] hover:bg-[var(--text-main)] hover:text-[var(--bg-main)] text-[var(--text-muted)] transition-colors border border-[var(--border-color)] group/key"
                                title="Cambiar Contraseña"
                            >
                                <Key size={16} className="group-hover/key:rotate-12 transition-transform" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal - Theme Compliant */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[var(--bg-card)] w-full max-w-lg rounded-3xl shadow-2xl border border-[var(--border-color)] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-main)]/50">
                            <div>
                                <h2 className="text-xl font-bold text-[var(--text-main)]">
                                    {selectedUser ? 'Editar Perfil' : 'Nuevo Usuario'}
                                </h2>
                                <p className="text-xs text-[var(--text-muted)] mt-1">Información de cuenta y permisos</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-main)] p-2 rounded-full transition-all">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6 md:p-8">
                            <form id="userForm" onSubmit={handleSave} className="space-y-5">
                                {!selectedUser && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">Username (ID)</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.userName}
                                            onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                                            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-main)] focus:ring-2 focus:ring-hd-orange/20 focus:border-hd-orange outline-none transition-all font-medium"
                                            placeholder="ej. jperez"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">Nombre Completo</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-main)] focus:ring-2 focus:ring-hd-orange/20 focus:border-hd-orange outline-none transition-all"
                                        placeholder="Nombre y Apellido"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-main)] focus:ring-2 focus:ring-hd-orange/20 focus:border-hd-orange outline-none transition-all"
                                        placeholder="correo@ejemplo.com"
                                    />
                                </div>

                                {!selectedUser && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">Contraseña</label>
                                        <input
                                            required
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-main)] focus:ring-2 focus:ring-hd-orange/20 focus:border-hd-orange outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">Rol / Permisos</label>
                                    <div className="relative">
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-main)] focus:ring-2 focus:ring-hd-orange/20 focus:border-hd-orange outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            {groups.map(g => (
                                                <option key={g.id} value={g.name}>{g.name}</option>
                                            ))}
                                        </select>
                                        <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] rotate-90 pointer-events-none" />
                                    </div>
                                </div>

                                {selectedUser && (
                                    <div className="flex items-center gap-3 p-4 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] cursor-pointer hover:border-hd-orange/30 transition-colors" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}>
                                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.isActive ? 'bg-hd-orange' : 'bg-gray-300 dark:bg-zinc-700'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${formData.isActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                        </div>
                                        <label className="text-sm font-semibold text-[var(--text-main)] cursor-pointer select-none flex-1">
                                            Habilitar Acceso
                                        </label>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-main)]/30 flex gap-4">
                            <Button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 bg-transparent hover:bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)] font-bold py-3.5 rounded-xl transition-all"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                form="userForm"
                                disabled={saving}
                                className="flex-1 bg-hd-orange hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-hd-orange/20 transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : 'Guardar'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Reset Password */}
            {isResetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[var(--bg-card)] w-full max-w-md rounded-3xl shadow-2xl border border-[var(--border-color)] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-[var(--border-color)] bg-[var(--bg-main)]">
                            <h2 className="text-xl font-bold text-[var(--text-main)]">Reestablecer Acceso</h2>
                            <p className="text-xs text-[var(--text-muted)] mt-1">Usuario: <span className="font-mono text-hd-orange font-bold uppercase">{selectedUser?.userName}</span></p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider ml-1">Nueva Contraseña</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-main)] focus:ring-2 focus:ring-hd-orange/20 focus:border-hd-orange outline-none transition-all"
                                    placeholder="••••••••"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <Button onClick={() => setIsResetModalOpen(false)} className="flex-1 bg-transparent hover:bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border-color)] font-bold py-3 rounded-xl">Cancelar</Button>
                                <Button onClick={handleResetPassword} disabled={saving} className="flex-1 bg-hd-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md">{saving ? '...' : 'Actualizar'}</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsuariosList;

