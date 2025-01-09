import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { menuItems } from '../utils/menuItems';
import { ChevronRight } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const { hasPermission } = useAuth();
  const { isExpanded, setIsExpanded } = useSidebar();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [lastClickedItem, setLastClickedItem] = useState<string | null>(null);

  const filteredItems = menuItems.filter(item => {
    if (item.permissions) {
      return item.permissions.some(permission => hasPermission(permission));
    }
    return true;
  });

  const handleItemClick = (itemLabel: string, hasSubmenu: boolean) => {
    if (hasSubmenu) {
      if (lastClickedItem === itemLabel && isExpanded) {
        setIsExpanded(false);
        setOpenSubmenu(null);
        setLastClickedItem(null);
      } else {
        setOpenSubmenu(itemLabel);
        setIsExpanded(true);
        setLastClickedItem(itemLabel);
      }
    } else {
      if (lastClickedItem === itemLabel && isExpanded) {
        setIsExpanded(false);
        setLastClickedItem(null);
      } else {
        setIsExpanded(true);
        setLastClickedItem(itemLabel);
      }
      setOpenSubmenu(null);
    }
  };

  return (
    <aside
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 ease-in-out overflow-y-auto ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {filteredItems.map((item, index) => {
              const Icon = item.icon;
              
              if (item.isSubmenu && item.submenu) {
                const isActive = location.pathname.startsWith('/cabinet') ||
                             location.pathname === '/treatments' ||
                             location.pathname === '/admin';
                
                return (
                  <div key={index}>
                    <button
                      onClick={() => handleItemClick(item.label, true)}
                      className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon
                        className={`flex-shrink-0 ${
                          isExpanded ? 'mr-3' : 'mx-auto'
                        } h-5 w-5 ${
                          isActive
                            ? 'text-indigo-700'
                            : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                      />
                      {isExpanded && (
                        <div className="flex items-center justify-between w-full min-w-0">
                          <span className="truncate">{item.label}</span>
                          <ChevronRight 
                            className={`flex-shrink-0 ml-2 h-4 w-4 transform transition-transform ${
                              openSubmenu === item.label ? 'rotate-90' : ''
                            }`}
                          />
                        </div>
                      )}
                    </button>
                    
                    {openSubmenu === item.label && isExpanded && (
                      <div className="ml-8 mt-2 space-y-1">
                        {item.submenu
                          .filter(subItem => 
                            !subItem.permissions || subItem.permissions.some(permission => hasPermission(permission))
                          )
                          .map((subItem, subIndex) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = location.pathname === subItem.path;
                          
                          return (
                            <Link
                              key={subIndex}
                              to={subItem.path}
                              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                                isSubActive
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <SubIcon
                                className={`flex-shrink-0 mr-3 h-5 w-5 ${
                                  isSubActive
                                    ? 'text-indigo-700'
                                    : 'text-gray-400 group-hover:text-gray-500'
                                }`}
                              />
                              <span className="truncate">{subItem.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={index}
                  to={item.path || '#'}
                  onClick={(e) => {
                    if (item.path === location.pathname) {
                      e.preventDefault();
                    }
                    handleItemClick(item.label, false);
                  }}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon
                    className={`flex-shrink-0 ${
                      isExpanded ? 'mr-3' : 'mx-auto'
                    } h-5 w-5 ${
                      isActive
                        ? 'text-indigo-700'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {isExpanded && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}