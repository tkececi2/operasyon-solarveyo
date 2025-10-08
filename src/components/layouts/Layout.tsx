import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileSidebar } from './MobileSidebar';
// import { BottomTabBar } from './BottomTabBar';
import { platform } from '../../utils/platform';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // iOS için özel layout
  if (platform.isNative()) {
    return (
      <div className="ios-fixed-viewport">
        {/* Mobile sidebar overlay */}
        <MobileSidebar 
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        {/* Main container */}
        <div className="flex flex-col h-full">
          {/* Header - Sabit header */}
          <div className="flex-shrink-0">
            <Header 
              onMenuClick={() => setSidebarOpen(true)}
              sidebarCollapsed={false}
              onToggleSidebar={() => {}}
            />
          </div>
          
          {/* Scrollable content - Header'dan sonra başla */}
          <main 
            className="flex-1 bg-gray-50 dark:bg-gray-900"
            style={{
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="container mx-auto px-4 py-6">
              <Outlet />
            </div>
          </main>
        </div>
        
        {/* Fixed bottom tab bar - KALDIRILDI */}
        {/* <BottomTabBar /> */}
      </div>
    );
  }

  // Web layout
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      <MobileSidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar 
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
