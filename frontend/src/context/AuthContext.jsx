import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedRole = localStorage.getItem('role');
    const savedUsername = localStorage.getItem('username');
    if (token && savedRole && savedUsername) {
      setUser({ username: savedUsername, role: savedRole });
    }
    setLoading(false);
  }, [token]);

  const login = (userData) => {
    localStorage.setItem('token', userData.access_token);
    localStorage.setItem('role', userData.role);
    localStorage.setItem('username', userData.username);
    setToken(userData.access_token);
    setUser({ username: userData.username, role: userData.role });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
