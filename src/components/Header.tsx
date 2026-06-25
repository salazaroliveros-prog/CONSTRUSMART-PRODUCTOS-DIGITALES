import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import CartButton from '@/components/CartButton';

const Header: React.FC<{ onNavigate?: (id: string) => void }> = ({ onNavigate }) => {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => setMounted(true), []);

  const links = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'productos', label: 'Productos Digitales' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'calculadora', label: 'Calculadora' },
    { id: 'contacto', label: 'Contacto' },
  ];

  const handleClick = (id: string) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    onNavigate?.(id);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a2332]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        <button onClick={() => handleClick('inicio')} className="flex items-center gap-3 text-white group">
          <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-orange-500/30 group-hover:ring-orange-500/60 transition-all duration-300">
            <img
              src="/LOGO.jpg"
              alt="Construsmart"
              className="w-full h-full object-cover"
              width="44"
              height="44"
            />
          </div>
          <div className="text-left">
            <div className="font-bold text-lg leading-none tracking-tight">CONSTRUSMART</div>
            <div className="text-xs text-orange-400 font-medium">VENTAS DIGITALES</div>
          </div>
        </button>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map(l => (
            <button
              key={l.id}
              onClick={() => handleClick(l.id)}
              className="text-white/80 hover:text-orange-400 transition text-sm font-medium"
            >
              {l.label}
            </button>
          ))}
          <CartButton />
          <Link to="/admin" className="text-white/50 hover:text-white text-xs">Admin</Link>
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-white/70 hover:text-orange-400 transition p-1.5 rounded-lg hover:bg-white/10"
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => handleClick('contacto')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition"
          >
            Solicitar Cotización
          </button>
        </nav>

        <button onClick={() => setOpen(!open)} className="lg:hidden text-white">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-[#1a2332] border-t border-white/10 px-4 py-4 space-y-2">
          {links.map(l => (
            <button
              key={l.id}
              onClick={() => handleClick(l.id)}
              className="block w-full text-left text-white/80 hover:text-orange-400 py-2"
            >
              {l.label}
            </button>
          ))}
          <CartButton />
          <Link to="/admin" className="block text-white/60 py-2 text-sm">Panel Admin</Link>
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex items-center gap-2 text-white/70 py-2 text-sm hover:text-orange-400"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            </button>
          )}
          <button
            onClick={() => handleClick('contacto')}
            className="w-full bg-orange-500 text-white px-4 py-3 rounded-lg font-semibold"
          >
            Solicitar Cotización
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;