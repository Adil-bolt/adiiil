import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  path?: string;
  isActive: boolean;
  onClick: () => void;
}

export function MenuItem({ icon: Icon, label, path, isActive, onClick }: MenuItemProps) {
  return (
    <Link
      to={path || '#'}
      onClick={onClick}
      className={`group flex items-center px-4 py-2 text-sm ${
        isActive
          ? 'bg-indigo-100 text-indigo-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon
        className={`mr-3 h-4 w-4 flex-shrink-0 ${
          isActive
            ? 'text-indigo-700'
            : 'text-gray-400 group-hover:text-gray-500'
        }`}
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}