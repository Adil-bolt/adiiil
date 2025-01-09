import React from 'react';
import { User } from 'lucide-react';
import { getAvatarSize } from '../../utils/avatarUtils';

interface UserAvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ src, name, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClass = getAvatarSize(size);
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div 
      className={`${sizeClass} rounded-full bg-indigo-100 flex items-center justify-center ${className}`}
      title={name}
    >
      {initials ? (
        <span className="text-indigo-700 font-medium">
          {initials}
        </span>
      ) : (
        <User className="h-6 w-6 text-indigo-600" />
      )}
    </div>
  );
}