import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-6">
          <ShieldX className="w-12 h-12 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Acceso No Autorizado
        </h1>
        
        <p className="text-gray-600 mb-8">
          No tienes permisos suficientes para acceder a esta página.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;