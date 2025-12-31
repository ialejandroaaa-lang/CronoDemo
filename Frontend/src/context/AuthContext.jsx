import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.removeItem('auth_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (userData) => {
        // userData matches AuthResponseDto
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setUser(userData);
        navigate('/');
    };

    const logout = () => {
        localStorage.removeItem('auth_user');
        setUser(null);
        navigate('/login');
    };

    const hasPermission = (permissionCode) => {
        if (!user || !user.permissions) return false;
        if (user.role === 'ADMINISTRADORES') return true;
        return user.permissions.includes(permissionCode);
    };

    // Helper to get behavior for a permission if it was implemented in the JWT (optional refinement)
    // For now, we'll assume a standard check and implement behavior in the GateKeeper component.

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);


