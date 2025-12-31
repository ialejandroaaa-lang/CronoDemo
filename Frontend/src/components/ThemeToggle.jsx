import React, { useContext } from 'react';
import { ThemeContext } from '../theme/ThemeContext';

import { Moon, Sun, Eye, Settings } from 'lucide-react';

const ThemeToggle = () => {
    const { theme, setTheme } = useContext(ThemeContext);

    const themes = [
        { id: 'original', icon: Sun, label: 'Claro' },
        { id: 'soft-dark', icon: Eye, label: 'Relajante' },
        { id: 'homeDepot', icon: Moon, label: 'HD Dark' }
    ];

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex bg-hd-black/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-2xl scale-90 hover:scale-100 transition-all duration-300">
            {themes.map((t) => (
                <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    title={t.label}
                    className={`p-3 rounded-xl transition-all duration-300 flex items-center gap-2 ${theme === t.id
                            ? 'bg-hd-orange text-white shadow-lg shadow-hd-orange/20'
                            : 'text-zinc-500 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <t.icon size={18} />
                    {theme === t.id && <span className="text-[10px] font-black uppercase tracking-widest pr-1 animate-in fade-in slide-in-from-left-2">{t.label}</span>}
                </button>
            ))}
        </div>
    );
};

export default ThemeToggle;
