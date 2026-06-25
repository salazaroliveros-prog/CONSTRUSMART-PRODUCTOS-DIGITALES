import React from 'react';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const scroll = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <footer className="bg-[#0f1620] text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl overflow-hidden ring-2 ring-orange-500/30 flex-shrink-0">
              <img src="/LOGO.jpg" alt="Construsmart" className="w-full h-full object-cover" width="44" height="44" />
            </div>
            <div>
              <div className="font-bold text-lg">CONSTRUSMART</div>
              <div className="text-xs text-orange-400 font-medium">VENTAS DIGITALES</div>
            </div>
          </div>
          <p className="text-sm text-white/60">
            Especialistas en construcción residencial, comercial e industrial en toda Guatemala.
          </p>
          <div className="flex gap-3 mt-4">
            {[Facebook, Instagram, Linkedin].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 rounded-full bg-white/10 hover:bg-orange-500 flex items-center justify-center transition">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Productos Digitales</h4>
          <ul className="space-y-2 text-sm text-white/60">
            <li><button onClick={() => scroll('productos')} className="hover:text-orange-400">Apps de Cálculo</button></li>
            <li><button onClick={() => scroll('productos')} className="hover:text-orange-400">ERP Constructor</button></li>
            <li><button onClick={() => scroll('productos')} className="hover:text-orange-400">Planos & Render 3D</button></li>
            <li><button onClick={() => scroll('productos')} className="hover:text-orange-400">Diseños Residenciales</button></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Servicios</h4>
          <ul className="space-y-2 text-sm text-white/60">
            <li><button onClick={() => scroll('servicios')} className="hover:text-orange-400">Proyectos llave en mano</button></li>
            <li><button onClick={() => scroll('servicios')} className="hover:text-orange-400">Supervisión de obras</button></li>
            <li><button onClick={() => scroll('servicios')} className="hover:text-orange-400">Agrimensura</button></li>
            <li><button onClick={() => scroll('servicios')} className="hover:text-orange-400">Topografía</button></li>
            <li><button onClick={() => scroll('servicios')} className="hover:text-orange-400">Urbanizaciones</button></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4">Empresa</h4>
          <ul className="space-y-2 text-sm text-white/60">
            <li><button onClick={() => scroll('inicio')} className="hover:text-orange-400">Inicio</button></li>
            <li><button onClick={() => scroll('calculadora')} className="hover:text-orange-400">Calculadora</button></li>
            <li><button onClick={() => scroll('contacto')} className="hover:text-orange-400">Contacto</button></li>
            <li><Link to="/admin" className="hover:text-orange-400">Panel Admin</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 pt-6 text-center text-sm text-white/40">
        © {new Date().getFullYear()} CONSTRUSMART. Todos los derechos reservados. Guatemala 🇬🇹
      </div>
    </footer>
  );
};

export default Footer;
