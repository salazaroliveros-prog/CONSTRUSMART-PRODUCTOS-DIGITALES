import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { portfolioService, type PortfolioProject } from '@/lib/portfolioService';
import { ArrowLeft, MapPin, User, Calendar, Search, X, ExternalLink, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const Portfolio: React.FC = () => {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const allProjects = await portfolioService.getProjects();
    setProjects(allProjects);

    const cats = await portfolioService.getCategories();
    setCategories(cats);

    setLoading(false);
  };

  const filtered = filter === 'all'
    ? projects
    : projects.filter(p => p.category === filter || p.service_category === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a2332] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <Link to="/" className="text-white/70 hover:text-white flex items-center gap-2 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Nuestros Trabajos</h1>
          <p className="text-gray-400">Galería de proyectos realizados por nuestro equipo profesional</p>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
              filter === 'all' ? 'bg-[#1a2332] text-white' : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-400'
            }`}
          >
            Todos ({projects.length})
          </button>
          {categories.map(cat => {
            const count = projects.filter(p => p.category === cat || p.service_category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                  filter === cat ? 'bg-[#1a2332] text-white' : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-400'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects Grid */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-gray-500">Cargando proyectos...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="text-6xl mb-4">🏗️</div>
            <p className="text-xl font-semibold text-gray-700 mb-2">No hay proyectos aún</p>
            <p>El administrador aún no ha publicado trabajos en esta categoría.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(project => (
              <div
                key={project.id}
                onClick={() => { setSelectedProject(project); setSelectedImageIndex(0); }}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
              >
                {/* Cover image */}
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  {project.images && project.images.length > 0 ? (
                    <img
                      src={project.images[0].image_url}
                      alt={project.images[0].caption || project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ExternalLink className="w-12 h-12" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                      {project.category || project.service_category || 'General'}
                    </span>
                    {project.is_featured && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                        Destacado
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-[#1a2332] mb-2">{project.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>
                  
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {project.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {project.location}
                      </span>
                    )}
                    {project.client_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {project.client_name}
                      </span>
                    )}
                    {project.completion_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(project.completion_date).getFullYear()}
                      </span>
                    )}
                  </div>

                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {project.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="text-xs text-gray-400">+{project.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedProject(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Image viewer */}
            <div className="relative bg-black">
              {selectedProject.images && selectedProject.images.length > 0 ? (
                <>
                  <img
                    src={selectedProject.images[selectedImageIndex]?.image_url}
                    alt={selectedProject.images[selectedImageIndex]?.caption || selectedProject.title}
                    className="w-full h-[400px] object-contain"
                  />
                  {selectedProject.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex(i => (i - 1 + selectedProject.images.length) % selectedProject.images.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex(i => (i + 1) % selectedProject.images.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                  {/* Image counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {selectedProject.images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImageIndex(i)}
                        className={`w-2.5 h-2.5 rounded-full transition ${
                          i === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Sin imágenes disponibles
                </div>
              )}
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Project info */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                  {selectedProject.category || selectedProject.service_category || 'General'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#1a2332] mb-3">{selectedProject.title}</h2>
              <p className="text-gray-600 mb-4">{selectedProject.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {selectedProject.location && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <MapPin className="w-4 h-4 text-orange-500 mb-1" />
                    <div className="text-xs text-gray-500">Ubicación</div>
                    <div className="text-sm font-semibold">{selectedProject.location}</div>
                  </div>
                )}
                {selectedProject.client_name && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <User className="w-4 h-4 text-orange-500 mb-1" />
                    <div className="text-xs text-gray-500">Cliente</div>
                    <div className="text-sm font-semibold">{selectedProject.client_name}</div>
                  </div>
                )}
                {selectedProject.completion_date && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <Calendar className="w-4 h-4 text-orange-500 mb-1" />
                    <div className="text-xs text-gray-500">Fecha</div>
                    <div className="text-sm font-semibold">
                      {new Date(selectedProject.completion_date).toLocaleDateString('es-GT')}
                    </div>
                  </div>
                )}
              </div>

              {selectedProject.tags && selectedProject.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-6 border-t flex gap-3">
                <Link
                  to="/#servicios"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-center py-3 rounded-lg font-semibold"
                  onClick={() => setSelectedProject(null)}
                >
                  Solicitar servicio similar
                </Link>
                <a
                  href={`https://wa.me/50240601526?text=Hola,%20me%20interesa%20un%20servicio%20similar%20al%20proyecto%20${encodeURIComponent(selectedProject.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold whitespace-nowrap"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;