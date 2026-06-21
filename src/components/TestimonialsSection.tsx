import React from 'react';
import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'María Hernández',
    role: 'Propietaria, Quetzaltenango',
    text: 'Excelente trabajo. Construyeron mi casa de 180 m² en tiempo récord y con calidad impecable.',
    rating: 5,
  },
  {
    name: 'Ing. Carlos Méndez',
    role: 'Desarrollador, Guatemala',
    text: 'El ERP les compró mucho tiempo a mi empresa. Recomiendo totalmente sus soluciones digitales.',
    rating: 5,
  },
  {
    name: 'Familia López',
    role: 'Clientes, Sacatepéquez',
    text: 'Los renders 3D nos ayudaron a visualizar todo antes de construir. ¡Quedó idéntico!',
    rating: 5,
  },
  {
    name: 'Roberto Castillo',
    role: 'Lotificador, Petén',
    text: 'La planificación urbana fue clave para mi proyecto. Excelente equipo técnico y legal.',
    rating: 5,
  },
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#1a2332] mb-4">
            Lo que dicen nuestros <span className="text-orange-500">clientes</span>
          </h2>
          <p className="text-gray-600">Proyectos completados en todo Guatemala.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition">
              <Quote className="w-8 h-8 text-orange-300 mb-3" />
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-orange-400 text-orange-400" />
                ))}
              </div>
              <p className="text-gray-700 text-sm mb-4">"{t.text}"</p>
              <div>
                <div className="font-semibold text-[#1a2332] text-sm">{t.name}</div>
                <div className="text-xs text-gray-500">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
