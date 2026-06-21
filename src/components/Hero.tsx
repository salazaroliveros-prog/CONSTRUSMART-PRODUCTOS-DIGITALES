import React from 'react';
import { ArrowRight, Calculator, Building2, CheckCircle2 } from 'lucide-react';
import { HERO_IMAGE } from '@/lib/constructionData';

const Hero: React.FC = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="inicio" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={HERO_IMAGE} alt="Construcción residencial" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a2332]/95 via-[#1a2332]/80 to-[#1a2332]/40" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-white">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 px-4 py-2 rounded-full text-orange-300 text-sm font-medium mb-6">
            <Building2 className="w-4 h-4" />
            Líderes en construcción en Guatemala
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Transformamos <span className="text-orange-400">Ideas</span> en Realidad
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed max-w-xl">
            Software especializado, diseños arquitectónicos y servicios de construcción
            profesionales en los 22 departamentos de Guatemala.
          </p>

          <div className="flex flex-wrap gap-4 mb-10">
            <button
              onClick={() => scrollTo('calculadora')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-7 py-4 rounded-xl font-semibold flex items-center gap-2 transition shadow-lg shadow-orange-500/30"
            >
              <Calculator className="w-5 h-5" />
              Calcular Mi Obra
            </button>
            <button
              onClick={() => scrollTo('servicios')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur text-white px-7 py-4 rounded-xl font-semibold flex items-center gap-2 transition border border-white/20"
            >
              Ver Servicios
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-md">
            {[
              { n: '+500', l: 'Proyectos' },
              { n: '22', l: 'Departamentos' },
              { n: '+15', l: 'Años exp.' },
            ].map(s => (
              <div key={s.l}>
                <div className="text-3xl md:text-4xl font-bold text-orange-400">{s.n}</div>
                <div className="text-sm text-white/70">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right card */}
        <div className="hidden lg:block">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="text-white space-y-4">
              <h3 className="text-2xl font-bold mb-4">¿Por qué elegirnos?</h3>
              {[
                'Costos reales por departamento actualizados',
                'Software propio para optimizar tu obra',
                'Diseños 3D fotorrealistas',
                'Garantía estructural y de calidad',
                'Trámites legales incluidos',
              ].map(f => (
                <div key={f} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
