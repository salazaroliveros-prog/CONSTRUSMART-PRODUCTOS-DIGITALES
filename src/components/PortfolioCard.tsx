import React from 'react';
import type { PortfolioProject } from '@/lib/portfolioService';

interface PortfolioCardProps {
  project: PortfolioProject;
  onClick: () => void;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ project, onClick }) => {
  const mainImage = project.images?.[0]?.image_url || 'https://d64gsuwffb70l.cloudfront.net/6a1093dc76aee1f11d76c7cd_1779473324122_560bb4c3.jpg';

  return (
    <div
      onClick={onClick}
      className="portfolio-card group relative bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex-shrink-0 w-[320px] h-[400px]"
    >
      <div className="absolute inset-0">
        <img
          src={mainImage}
          alt={project.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <span className="inline-block text-xs font-semibold text-orange-400 bg-black/40 backdrop-blur px-2 py-0.5 rounded-full mb-2">
          {project.category || 'Proyecto'}
        </span>
        <h3 className="text-lg font-bold text-white mb-1">{project.title}</h3>
        <p className="text-sm text-white/80 line-clamp-2">{project.description}</p>
        {project.location && (
          <p className="text-xs text-white/60 mt-2">{project.location}</p>
        )}
      </div>
    </div>
  );
};

export default PortfolioCard;
