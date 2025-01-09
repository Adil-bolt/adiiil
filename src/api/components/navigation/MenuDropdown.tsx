import React from 'react';
import { useLocation } from 'react-router-dom';
import { MenuItem } from './MenuItem';
import { SubMenuItem } from './SubMenuItem';
import { menuItems } from '../../utils/menuItems';
import { useAuth } from '../../contexts/AuthContext';

interface MenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MenuDropdown({ isOpen, onClose }: MenuDropdownProps) {
  const location = useLocation();
  const { hasPermission } = useAuth();

  if (!isOpen) return null;

  const filteredItems = menuItems.filter(item => {
    if (item.permissions) {
      return item.permissions.some(permission => hasPermission(permission));
    }
    if (item.submenu) {
      return item.submenu.some(subItem => 
        subItem.permissions.some(permission => hasPermission(permission))
      );
    }
    return true;
  });

  return (
    <div 
      className="fixed left-16 top-16 w-64 bg-white rounded-md shadow-xl ring-1 ring-black ring-opacity-5 z-[9999] overflow-y-auto max-h-[calc(100vh-5rem)]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-2">
        {filteredItems.map((item, index) => {
          if (item.isSubmenu && item.submenu) {
            return (
              <div key={index} className="px-4 py-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {item.label}
                </div>
                <div className="mt-1 space-y-1">
                  {item.submenu.map((subItem, subIndex) => (
                    <SubMenuItem
                      key={subIndex}
                      icon={subItem.icon}
                      label={subItem.label}
                      path={subItem.path}
                      isActive={location.pathname === subItem.path}
                      onClick={onClose}
                    />
                  ))}
                </div>
              </div>
            );
          }

          return (
            <MenuItem
              key={index}
              icon={item.icon}
              label={item.label}
              path={item.path}
              isActive={location.pathname === item.path}
              onClick={onClose}
            />
          );
        })}
      </div>
    </div>
  );
}