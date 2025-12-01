import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Home, CircleArrowUp, CircleArrowDown, PieChart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NavItem = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center justify-center w-full h-full space-y-1",
        isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-primary transition-colors"
      )}
    >
      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10px] uppercase tracking-wide">{label}</span>
    </Link>
  );
};

export const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center justify-around px-2 pb-safe z-50">
      <NavItem to="/" icon={Home} label="Home" />
      <NavItem to="/incomes" icon={CircleArrowUp} label="Entrate" />
      <NavItem to="/expenses" icon={CircleArrowDown} label="Uscite" />
      <NavItem to="/stats" icon={PieChart} label="Stats" />
      <NavItem to="/settings" icon={Settings} label="Settings" />
    </div>
  );
};
