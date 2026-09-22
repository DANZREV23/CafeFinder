import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, ApiResponse } from '../types';
import { 
  fetchApi, 
  getStoredToken, 
  setStoredToken, 
  getStoredUser, 
  setStoredUser, 
  clearStoredAuth 
} from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: any) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const hasToken = !!getStoredToken();
    try {
      const response = await fetchApi<ApiResponse<{ user: User; token?: string }>>('/auth/me');
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        setStoredUser(response.data.user);
        if (response.data.token) {
          setStoredToken(response.data.token);
        }
      } else {
        setUser(null);
        clearStoredAuth();
      }
    } catch (error) {
      if (hasToken) {
        setUser(null);
        clearStoredAuth();
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (data: any): Promise<User> => {
    const response = await fetchApi<ApiResponse<{ user: User; token?: string }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const loggedInUser = response.data.user;
    if (response.data.token) {
      setStoredToken(response.data.token);
    }
    setStoredUser(loggedInUser);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (data: any): Promise<User> => {
    const response = await fetchApi<ApiResponse<{ user: User; token?: string }>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const registeredUser = response.data.user;
    if (response.data.token) {
      setStoredToken(response.data.token);
    }
    setStoredUser(registeredUser);
    setUser(registeredUser);
    return registeredUser;
  };

  const logout = async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout request warning:', e);
    } finally {
      clearStoredAuth();
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
