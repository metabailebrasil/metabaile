
import React, { useState } from 'react';
import { Menu, X, Play } from 'lucide-react';
import { APP_NAME, NAV_ITEMS } from '../constants';

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav 
      className="absolute top-0 w-full z-50 py-6"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg bg-white">
              <Play fill="#0f172a" size={16} className="ml-1 text-brand-dark" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-white">
              {APP_NAME}
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {NAV_ITEMS.map((item) => (
              <a 
                key={item.label} 
                href={item.href} 
                className="text-sm font-medium transition-colors tracking-wide hover:text-brand-primary text-white/80 hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <button className="bg-gradient-brand text-brand-dark px-6 py-2.5 rounded-full font-bold text-sm hover:shadow-lg hover:shadow-brand-primary/30 transition-all transform hover:scale-105 border border-transparent">
              Entrar
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl">
          <div className="flex flex-col p-4 space-y-4">
            {NAV_ITEMS.map((item) => (
              <a 
                key={item.label} 
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-slate-700 hover:text-brand-primary"
              >
                {item.label}
              </a>
            ))}
            <button className="w-full bg-gradient-brand text-brand-dark py-3 rounded-lg font-bold shadow-md">
              Entrar
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
