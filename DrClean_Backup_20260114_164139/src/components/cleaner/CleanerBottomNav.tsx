import { Home, User, History } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export function CleanerBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: 'Domů', path: '/cleaner/dashboard' },
    { icon: History, label: 'Historie', path: '/cleaner/history' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[10000] bg-background border-t">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
