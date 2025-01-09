import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import { UserPhotoUploader } from './user/UserPhotoUploader';
import { MenuDropdown } from './navigation/MenuDropdown';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 z-50">
      <div className="h-16 px-4 flex items-center justify-between">
        {/* Section gauche avec le logo et le menu */}
        <div className="flex items-center pl-1">
          <Logo size="sm" />
          <div ref={menuRef} className="ml-1">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Section centrale avec le titre */}
        <div className="flex-1 flex justify-center items-center">
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors whitespace-nowrap">
              Cabinet de Psychiatrie SATLI Mina
            </h1>
          </Link>
        </div>

        {/* Section droite avec les notifications et le profil */}
        <div className="flex items-center pr-1">
          {user && (
            <div className="flex items-center space-x-3">
              <Bell className="h-6 w-6 text-gray-400 hover:text-gray-500 cursor-pointer" />
              
              <div className="flex items-center space-x-2">
                <UserPhotoUploader
                  userId={user.id}
                  currentPhotoUrl={user.photoUrl}
                  name={user.name}
                  size="sm"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">A</span>
                  <span className="text-xs text-gray-500">Admin</span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center px-2 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors whitespace-nowrap"
                title="Se déconnecter"
              >
                <LogOut className="h-5 w-5 mr-1" />
                <span className="hidden sm:inline">Se déconnecter</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <MenuDropdown isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </nav>
  );
}