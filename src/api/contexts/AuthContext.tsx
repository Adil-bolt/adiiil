import React, { createContext, useContext, useState, useEffect } from 'react';
import { PhotoService } from '../services/photo/PhotoService';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'docteur' | 'secretaire';
  name: string;
  photoUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  updateUserPhoto: (userId: string, photoUrl: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      // Récupérer la photo de l'utilisateur
      const photoUrl = PhotoService.getUserPhoto(parsedUser.id);
      return { ...parsedUser, photoUrl };
    }
    return null;
  });

  const login = async (username: string, password: string) => {
    // Votre logique de login existante...
    const loggedInUser = {
      id: '1', // Remplacer par l'ID réel
      username,
      role: 'admin' as const, // Forcer le rôle admin pour avoir toutes les permissions
      name: 'Admin',
    };

    // Récupérer la photo de l'utilisateur
    const photoUrl = PhotoService.getUserPhoto(loggedInUser.id);
    const userWithPhoto = { ...loggedInUser, photoUrl };

    setUser(userWithPhoto);
    localStorage.setItem('user', JSON.stringify(userWithPhoto));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateUserPhoto = (userId: string, photoUrl: string | null) => {
    if (user && user.id === userId) {
      const updatedUser = { ...user, photoUrl };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Si la permission demandée est 'admin', vérifier si l'utilisateur est admin
    if (permission === 'admin') {
      return user.role === 'admin';
    }

    // Pour toute autre permission, l'admin a tous les droits
    return user.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission, updateUserPhoto }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}