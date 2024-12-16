"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  userEmail: string;
  userPassword: string;
  setUserEmail: (email: string) => void;
  setUserPassword: (password: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');

  // Load stored auth data on initial mount
  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const storedPassword = localStorage.getItem('userPassword');
    
    if (storedEmail) setUserEmail(storedEmail);
    if (storedPassword) setUserPassword(storedPassword);
  }, []);

  // Update localStorage when auth data changes
  const updateEmail = (email: string) => {
    setUserEmail(email);
    localStorage.setItem('userEmail', email);
  };

  const updatePassword = (password: string) => {
    setUserPassword(password);
    localStorage.setItem('userPassword', password);
  };

  const logout = () => {
    setUserEmail('');
    setUserPassword('');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPassword');
  };

  return (
    <AuthContext.Provider value={{ 
      userEmail, 
      userPassword, 
      setUserEmail: updateEmail, 
      setUserPassword: updatePassword,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 