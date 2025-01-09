import React, { createContext, useContext, useState, useEffect } from 'react';
import { PhotoService } from '../services/photo/PhotoService';

interface LogoContextType {
  logoUrl: string | null;
  updateLogo: (file: File) => Promise<void>;
  isLoading: boolean;
}

const LogoContext = createContext<LogoContextType | null>(null);

export function LogoProvider({ children }: { children: React.ReactNode }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const savedLogo = await PhotoService.getLogo();
        setLogoUrl(savedLogo);
      } catch (error) {
        console.error('Error loading logo:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLogo();
  }, []);

  const updateLogo = async (file: File) => {
    try {
      setIsLoading(true);
      const newLogoUrl = await PhotoService.uploadLogo(file);
      setLogoUrl(newLogoUrl);
    } catch (error) {
      console.error('Error updating logo:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LogoContext.Provider value={{ logoUrl, updateLogo, isLoading }}>
      {children}
    </LogoContext.Provider>
  );
}

export const useLogo = () => {
  const context = useContext(LogoContext);
  if (!context) {
    throw new Error('useLogo must be used within a LogoProvider');
  }
  return context;
};