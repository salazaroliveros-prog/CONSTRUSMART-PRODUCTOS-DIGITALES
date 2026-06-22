import React from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, Calendar, User } from 'lucide-react';
import type { PortfolioProject } from '@/lib/portfolioService';

interface PortfolioModalProps {
  project: PortfolioProject;
  onClose: () => void;
}

const PortfolioModal: React.FC<PortfolioModalProps> = ({ project, onClose }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const images = project.images?.length ? project.images : [{ id: '0', project_id: project.id, image_url: '', caption: '', sort_order: 0 }];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="relative bg-gray-900 h-[400px] md:h-[500px] flex items-center justify-center">
          {images[activeIndex]?.image_url && (
            <img
              src={images[activeIndex].image_url}
              alt={images[activeIndex].caption || project.title}
              className="w-full h-full object-contain"
            />
          )}
          {!images[activeIndex]?.image_url && (
            <div className="text-white/40 text-lg">Sin imagen disponible</div>
          )}
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition">
            <X className="w-6 h-6" />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={() => setActiveIndex(i => (i - 1 + images.length) % images.length)}
                className="absolute left-4 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setActiveIndex(i => (i + 1) % images.length)}
                className="absolute right-4 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-2 transition"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-4 flex gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition ${i === activeIndex ? 'bg-orange-500' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="p-6 md:p-8">
          <span className="inline-block text-xs font-semibold text-orange-600 bg-orange-100 px-3 py-1 rounded-full mb-3">
            {project.category || 'Proyecto'}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a2332] mb-3">{project.title}</h2>
          <p className="text-gray-600 mb-4">{project.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {project.location && (
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {project.location}</span>
            )}
            {project.completion_date && (
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(project.completion_date).toLocaleDateString('es-GT', { year: 'numeric', month: 'long' })}</span>
            )}
            {project.client_name && (
              <span className="flex items-center gap-1"><User className="w-4 h-4" /> {project.client_name}</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-3">Galeria ({activeIndex + 1} de {images.length})</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveIndex(i)}
                    className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition ${i === activeIndex ? 'border-orange-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    {img.image_url && <img src={img.image_url} alt={img.caption || ''} className="w-full h-full object-cover" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioModal;
