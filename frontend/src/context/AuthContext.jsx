import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('utilisateur');
        return stored ? JSON.parse(stored) : null;
    });

    const login = (utilisateur, token) => {
        localStorage.setItem('utilisateur', JSON.stringify(utilisateur));
        localStorage.setItem('token', token);
        setUser(utilisateur);
    };

    const logout = () => {
        localStorage.removeItem('utilisateur');
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
