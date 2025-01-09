import React from 'react';
import { ProfilePhoto } from './ProfilePhoto';
import { useAuth } from '../../contexts/AuthContext';
import { PhotoService } from '../../services/photo/PhotoService';

interface UserPhotoUploaderProps {
  userId: string;
  currentPhotoUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserPhotoUploader({
  userId,
  currentPhotoUrl,
  name,
  size = 'md',
  className = ''
}: UserPhotoUploaderProps) {
  const { user, hasPermission, updateUserPhoto } = useAuth();
  const canEdit = user?.id === userId || hasPermission('manage_users');

  const handlePhotoChange = async (file: File | null) => {
    try {
      if (file) {
        const photoUrl = await PhotoService.uploadUserPhoto(userId, file);
        updateUserPhoto(userId, photoUrl);
      } else {
        updateUserPhoto(userId, null);
      }
    } catch (error) {
      console.error('Error updating user photo:', error);
    }
  };

  return (
    <ProfilePhoto
      currentPhotoUrl={currentPhotoUrl}
      name={name}
      size={size}
      onPhotoChange={handlePhotoChange}
      editable={canEdit}
      className={className}
    />
  );
}