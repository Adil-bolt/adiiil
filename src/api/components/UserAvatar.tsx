import React from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function UserAvatar({ src, name, size = 'md', className = '' }: UserAvatarProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

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
        className={`${sizes[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div 
      className={`${sizes[size]} rounded-full bg-indigo-100 flex items-center justify-center ${className}`}
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