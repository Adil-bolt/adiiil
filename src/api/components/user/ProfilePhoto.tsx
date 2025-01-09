import React, { useState, useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { useImageUpload } from '../../hooks/useImageUpload';
import { UserAvatar } from './UserAvatar';

interface ProfilePhotoProps {
  currentPhotoUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  onPhotoChange?: (file: File) => Promise<void>;
  editable?: boolean;
  className?: string;
}

export function ProfilePhoto({
  currentPhotoUrl,
  name,
  size = 'md',
  onPhotoChange,
  editable = true,
  className = ''
}: ProfilePhotoProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleImageSelect, isUploading } = useImageUpload({
    onImageSelected: async (file) => {
      setPreviewUrl(URL.createObjectURL(file));
      if (onPhotoChange) {
        await onPhotoChange(file);
      }
    },
    onError: (error) => {
      console.error('Error uploading image:', error);
      setPreviewUrl(null);
    }
  });

  const handleClick = () => {
    if (editable && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    if (onPhotoChange) {
      onPhotoChange(null);
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <div 
        onClick={handleClick}
        className={`relative ${editable ? 'cursor-pointer' : ''}`}
      >
        <UserAvatar
          src={previewUrl || currentPhotoUrl}
          name={name}
          size={size}
          className={isUploading ? 'opacity-50' : ''}
        />
        
        {editable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-6 w-6 text-white" />
          </div>
        )}

        {(previewUrl || currentPhotoUrl) && editable && (
          <button
            onClick={handleRemovePhoto}
            className="absolute -top-1 -right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      )}
    </div>
  );
}