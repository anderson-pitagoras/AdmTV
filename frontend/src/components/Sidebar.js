import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Server, DollarSign, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Usuários', path: '/users' },
    { icon: Server, label: 'Servidores DNS', path: '/dns' },
    { icon: DollarSign, label: 'Pagamentos', path: '/payments' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 h-screen bg-background/95 backdrop-blur border-r border-border fixed left-0 top-0 flex flex-col">
      <div className="p-8 border-b border-border">
        <h1 className="text-2xl font-heading font-black text-primary">IPTV Manager</h1>
        <p className="text-xs text-muted-foreground mt-1">Painel de Gerenciamento</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`sidebar-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <Button
                variant={isActive(item.path) ? 'default' : 'ghost'}
                className={`w-full justify-start ${isActive(item.path) ? 'shadow-lg shadow-primary/20' : ''}`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={logout}
          data-testid="sidebar-logout"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;