import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileSidebar } from './MobileSidebar';
import { BottomTabBar } from './BottomTabBar';
import { platform } from '../../utils/platform';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900" style={{ minHeight: '-webkit-fill-available' }}>
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Page content - iOS için optimize edilmiş scroll */}
        <main 
          className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900`} 
          style={platform.isNative() ? { 
            paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            position: 'relative',
            zIndex: 1
          } : undefined}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Tab Bar */}
      <BottomTabBar />
    </div>
  );
};
