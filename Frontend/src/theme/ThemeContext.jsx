import React, { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(localStorage.getItem("theme") || "soft-dark");

    useEffect(() => {
        // Remover clases anteriores
        document.documentElement.classList.remove("theme-original", "theme-homeDepot", "theme-soft-dark", "theme-light", "theme-dark");

        // Aplicar clase del tema actual
        document.documentElement.classList.add(`theme-${theme}`);

        // Agregar helper de sistema
        if (theme === 'soft-dark' || theme === 'homeDepot') {
            document.documentElement.classList.add("theme-dark");
        } else {
            document.documentElement.classList.add("theme-light");
        }

        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setThemeState(prev => prev === "original" ? "soft-dark" : "original");
    };

    const isDarkMode = theme === "soft-dark" || theme === "homeDepot";

    return (
        <ThemeContext.Provider value={{
            theme,
            toggleTheme,
            setTheme: setThemeState,
            isDarkMode
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = React.useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};


