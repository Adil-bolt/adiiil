import React from 'react';
import { UserPhotoUploader } from './UserPhotoUploader';
import { PhotoService } from '../../services/photo/PhotoService';

interface UserProfileSectionProps {
  user: {
    id: string;
    name: string;
    photoUrl?: string | null;
  };
  onPhotoUpdate?: () => void;
}

export function UserProfileSection({ user, onPhotoUpdate }: UserProfileSectionProps) {
  const handlePhotoChange = async (file: File | null) => {
    if (!file) return;
    
    try {
      const photoUrl = await PhotoService.uploadUserPhoto(user.id, file);
      if (onPhotoUpdate) {
        onPhotoUpdate();
      }
    } catch (error) {
      console.error('Error updating user photo:', error);
    }
  };

  return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow">
      <UserPhotoUploader
        userId={user.id}
        currentPhotoUrl={user.photoUrl}
        name={user.name}
        size="lg"
        onPhotoChange={handlePhotoChange}
      />
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
        <p className="text-sm text-gray-500">
          Cliquez sur la photo pour la modifier
        </p>
      </div>
    </div>
  );
}