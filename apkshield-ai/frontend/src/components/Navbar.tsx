import { Shield, Activity, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Upload', icon: <Zap size={16} /> },
    { to: '/dashboard', label: 'Dashboard', icon: <Activity size={16} /> },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-cyber-border bg-cyber-bg/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-cyber-accent rounded-lg flex items-center justify-center shadow-glow-accent group-hover:scale-110 transition-transform">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-gradient">APKShield</span>
              <span className="text-lg font-bold text-cyber-accent ml-1">AI</span>
            </div>
            <span className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/30 rounded">
              v1.0
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30'
                      : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-surface'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 text-xs text-cyber-text-dim">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
            <span className="hidden sm:inline font-mono">System Online</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
