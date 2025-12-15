import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md fixed top-0 left-64 right-0 z-10 flex items-center justify-between px-8">
      <div>
        <h2 className="text-lg font-heading font-bold">Bem-vindo, {user?.name}</h2>
        <p className="text-xs text-muted-foreground">{user?.email}</p>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        data-testid="theme-toggle"
        className="hover:-translate-y-0.5 transition-transform duration-200"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
    </header>
  );
};

export default Header;