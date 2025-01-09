import React, { useState } from 'react';
import { useImageUpload } from '../hooks/useImageUpload';
import { useAuth } from '../contexts/AuthContext';
import { useLogo } from '../contexts/LogoContext';
import { Edit } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const { hasPermission } = useAuth();
  const { logoUrl, updateLogo, isLoading } = useLogo();
  const [isHovered, setIsHovered] = useState(false);
  const canEdit = hasPermission('manage_users');

  const { handleImageSelect } = useImageUpload({
    onImageSelected: async (file) => {
      try {
        await updateLogo(file);
      } catch (error) {
        console.error('Error updating logo:', error);
      }
    },
    maxWidth: 200,
    maxHeight: 200
  });

  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div 
      className={`relative cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => canEdit && document.getElementById('logo-upload')?.click()}
    >
      <img
        src={logoUrl || '/logo.svg'}
        alt="Cabinet de Psychiatrie SATLI Mina"
        className={`${sizes[size]} ${isLoading ? 'opacity-50' : ''}`}
      />
      
      {canEdit && isHovered && (
        <>
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md transition-opacity">
            <Edit className="h-4 w-4 text-white" />
          </div>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </>
      )}
    </div>
  );
}