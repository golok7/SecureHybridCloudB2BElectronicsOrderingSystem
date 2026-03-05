import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Validate the token or verify session on initial load if needed
  useEffect(() => {
    // In a real production app, we might call a /me endpoint to verify the token
    // For now, if a token exists in local storage, we assume it is valid until an API call fails
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/login', { email, password });
      const { token } = res.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      navigate('/');
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.response?.data?.error || 'Login Failed' };
    }
  };

  const register = async (name, email, password) => {
    try {
      await api.post('/register', { name, email, password });
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: error.response?.data?.error || 'Registration Failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, register, loading }}>
        {!loading && children}
    </AuthContext.Provider>
  );
};
