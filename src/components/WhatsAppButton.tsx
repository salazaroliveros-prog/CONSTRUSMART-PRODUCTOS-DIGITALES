import React from 'react';
import { MessageCircle, X } from 'lucide-react';

const PHONE_NUMBER = '50255551234';
const DEFAULT_MESSAGE = 'Hola, estoy interesado en los productos y servicios de ConstructoraGT. ¿Podrían ayudarme?';

const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

const WhatsAppButton: React.FC = () => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {expanded && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 max-w-xs animate-in slide-in-from-bottom-4 fade-in duration-200">
          <p className="text-sm text-gray-700 font-medium mb-2">
            ¡Hola! ¿En qué podemos ayudarte?
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition w-full justify-center"
          >
            <MessageCircle className="w-5 h-5" />
            Abrir WhatsApp
          </a>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Respuesta en menos de 24 horas
          </p>
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 ${
          expanded
            ? 'bg-gray-800 hover:bg-gray-900 rotate-90 scale-110'
            : 'bg-green-500 hover:bg-green-600 hover:scale-110'
        }`}
        aria-label={expanded ? 'Cerrar chat' : 'Abrir WhatsApp'}
      >
        {expanded ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-7 h-7 text-white" />
        )}
      </button>
    </div>
  );
};

export default WhatsAppButton;
