import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Lock, User, Eye, EyeOff, ShieldCheck, Activity } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const LoginPage = () => {
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const { isDarkMode } = useTheme();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/Auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName, password })
            });

            if (response.ok) {
                const data = await response.json();
                login(data);
            } else {
                const errData = await response.json();
                setError(errData.message || 'Credenciales inválidas (401)');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-hd-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Accents */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-hd-orange/10 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-hd-orange/5 blur-[120px] rounded-full"></div>

            <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8 relative z-10 animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 bg-hd-orange rounded-2xl flex items-center justify-center shadow-lg shadow-hd-orange/20 mb-6 group transition-transform hover:scale-110">
                        <ShieldCheck size={36} className="text-white group-hover:animate-bounce" />
                    </div>
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">POS CRONO</h1>
                    <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
                        <Activity size={12} className="text-hd-orange" />
                        Acceso de Seguridad
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1 italic">
                            Nombre de Usuario
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-hd-orange transition-colors">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                required
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="w-full bg-zinc-800/50 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-hd-orange/50 focus:border-hd-orange transition-all font-medium placeholder:text-zinc-700"
                                placeholder="Ingresa tu usuario"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1 italic">
                            Contraseña
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-hd-orange transition-colors">
                                <Lock size={18} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-zinc-800/50 border border-white/5 rounded-xl py-4 pl-12 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-hd-orange/50 focus:border-hd-orange transition-all font-medium placeholder:text-zinc-700"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-wider p-4 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-hd-orange hover:bg-orange-600 text-white font-black uppercase tracking-widest py-6 rounded-xl shadow-lg shadow-hd-orange/20 transition-all active:scale-95 flex items-center justify-center gap-2 italic"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>Confirmar Acceso <Lock size={16} /></>
                        )}
                    </Button>
                </form>

                <div className="mt-10 pt-8 border-t border-white/5 text-center px-4">
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] leading-relaxed italic">
                        El acceso al sistema está monitoreado. Cualquier intento no autorizado será registrado en los registros de auditoría.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
