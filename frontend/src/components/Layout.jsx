import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ArrowRightLeft, 
  CalendarClock, 
  CheckSquare,
  Menu,
  X,
  Wallet
} from 'lucide-react';
import ConnectWallet from './ConnectWallet';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Transfers', path: '/transfers', icon: ArrowRightLeft },
    { name: 'Allowances', path: '/allowances', icon: CalendarClock },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen w-64 bg-bg-sidebar border-r border-border-light z-50
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3 text-accent-emerald font-bold text-xl">
            <Wallet size={28} />
            Family Fund
          </div>
          <button className="lg:hidden text-text-secondary hover:text-white" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>

        <nav className="px-4 mt-8 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-4 px-4 py-3 rounded-lg transition-colors font-medium
                  ${isActive 
                    ? 'bg-[rgba(139,92,246,0.15)] text-accent-purple border border-[rgba(139,92,246,0.3)]' 
                    : 'text-text-secondary hover:bg-white/5 hover:text-white border border-transparent'}
                `}
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
              >
                <Icon size={20} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

const Header = ({ toggleSidebar }) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-bg-primary/80 backdrop-blur-md border-b border-border-light">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-text-secondary hover:text-white" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-semibold hidden sm:block">Family Fund</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <ConnectWallet />
      </div>
    </header>
  );
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header toggleSidebar={() => setSidebarOpen(true)} />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
