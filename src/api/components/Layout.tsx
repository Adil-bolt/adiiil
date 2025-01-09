import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useSidebar } from '../contexts/SidebarContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isExpanded } = useSidebar();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header>
        <Navbar />
      </header>
      <div className="flex flex-1 pt-0 overflow-hidden">
        <Sidebar />
        <main 
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isExpanded ? 'ml-64' : 'ml-16'
          } overflow-auto`}
        >
          <div className="container mx-auto p-4 md:p-6 h-full">
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 min-h-[calc(100vh-8rem)]">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}