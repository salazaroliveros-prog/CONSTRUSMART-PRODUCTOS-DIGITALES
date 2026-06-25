import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { formatQ } from '@/lib/constructionData';
import { Eye, ShoppingCart, ArrowLeft, Home, FileText, Layers3, Loader2, Check, Download } from 'lucide-react';

interface DesignModel {
  code: string;
  name: string;
  category: string;
  model_group: string;
  facade_image: string;
  description: string;
  price: number;
  price_label: string;
  files_count: number;
  file_list: { file_name: string; file_type: string }[];
}

const CATEGORIES = [
  { id: 'diseno', label: 'Anteproyectos', icon: Home, desc: 'Planta amoblada + acotada + 2 fachadas en PDF' },
  { id: 'planos', label: 'Planos y Presupuestos', icon: FileText, desc: 'Planos estructurales, eléctricos, hidráulicos + presupuesto' },
  { id: 'render', label: 'Renders 3D', icon: Layers3, desc: 'Todas las vistas exteriores e interiores en alta resolución' },
];

const CATEGORY_EMOJI: Record<string, string> = { diseno: '\uD83D\uDCD0', planos: '\uD83D\uDCCB', render: '\uD83C\uDFA8' };

const DesignGallery: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('diseno');
  const [models, setModels] = useState<DesignModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacade, setSelectedFacade] = useState<{ name: string; url: string } | null>(null);

  useEffect(() => { loadModels(); }, [activeTab]);

  const loadModels = async () => {
    setLoading(true);
    try {
      const { data: modelsData } = await supabase
        .from('design_models').select('code,name,category,model_group,facade_image,description')
        .eq('category', activeTab).eq('is_active', true).order('sort_order');
      const codes = (modelsData || []).map(m => m.code);
      const { data: pricesData } = await supabase.from('design_prices').select('model_code,price,price_label').in('model_code', codes);
      const { data: filesData } = await supabase.from('design_files').select('model_code,file_name,file_type').in('model_code', codes);
      const priceMap = new Map((pricesData || []).map(p => [p.model_code, p]));
      const filesMap = new Map<string, any[]>();
      (filesData || []).forEach(f => { if (!filesMap.has(f.model_code)) filesMap.set(f.model_code, []); filesMap.get(f.model_code)!.push(f); });
      setModels((modelsData || []).map(m => ({ ...m, price: priceMap.get(m.code)?.price || 0, price_label: priceMap.get(m.code)?.price_label || formatQ(0), files_count: filesMap.get(m.code)?.length || 0, file_list: filesMap.get(m.code) || [] })));
    } catch { setModels([]); } finally { setLoading(false); }
  };

  const handleBuy = (model: DesignModel) => {
    sessionStorage.setItem('checkout_item', JSON.stringify({ id: model.code, name: model.name, category: 'Diseño', price: model.price, design_model: model.code, model_group: model.model_group }));
    navigate('/checkout');
  };

  const includes = activeTab === 'diseno' 
    ? ['Planta amoblada (PDF)', 'Planta acotada (PDF)', 'Fachada principal (PDF)', 'Fachada posterior (PDF)']
    : activeTab === 'planos'
    ? ['Planos estructurales', 'Planos eléctricos', 'Planos hidráulicos', 'Presupuesto detallado']
    : ['Vista exterior frontal', 'Vista exterior lateral', 'Vista interior sala', 'Vista interior cocina'];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-[#1a2332] to-[#243042] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <Link to="/" className="text-white/60 hover:text-white flex items-center gap-2 text-sm mb-4"><ArrowLeft className="w-4 h-4" /> Volver</Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Galería de Diseños</h1>
          <p className="text-gray-400 max-w-2xl">Cada diseño disponible en 3 modalidades: anteproyecto, planos constructivos y renders 3D. La misma fachada, diferentes niveles de detalle.</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-4 mb-8">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveTab(cat.id)} className={`flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold whitespace-nowrap transition shadow-sm ${activeTab === cat.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-400'}`}>
              <cat.icon className="w-5 h-5" /><span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-8">
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{CATEGORY_EMOJI[activeTab]}</div>
            <div><p className="font-semibold text-[#1a2332]">{CATEGORIES.find(c => c.id === activeTab)?.label}</p><p className="text-sm text-gray-600">{CATEGORIES.find(c => c.id === activeTab)?.desc}</p></div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-12">
        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" /><p className="text-gray-500">Cargando...</p></div>
        ) : models.length === 0 ? (
          <div className="text-center py-20 text-gray-500"><Home className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-xl font-semibold text-gray-700 mb-2">No hay diseños disponibles</p><p>Pronto agregaremos más modelos.</p></div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map(model => (
              <div key={model.code} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="relative h-52 bg-gray-200 cursor-pointer group" onClick={() => setSelectedFacade({ name: model.name, url: model.facade_image })}>
                  <img src={model.facade_image} alt={model.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 bg-white/90 text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold"><Eye className="w-4 h-4" /> Ver fachada</div>
                  </div>
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur rounded-lg px-3 py-1 text-xs font-bold text-[#1a2332]">{model.model_group}</div>
                  <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">{CATEGORIES.find(c => c.id === activeTab)?.label}</div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-[#1a2332] mb-2">{model.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 flex-1">{model.description}</p>
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs font-semibold text-gray-700 mb-1.5">Incluye:</p>
                    <ul className="space-y-1">{includes.map((item, i) => (<li key={i} className="flex items-center gap-2 text-xs text-gray-600"><Check className="w-3 h-3 text-green-600 flex-shrink-0" />{item}</li>))}</ul>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4"><Download className="w-3 h-3" /><span>{model.files_count} archivos descargables al comprar</span></div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <div><div className="text-xs text-gray-500">Precio</div><div className="text-2xl font-bold text-orange-600">{model.price_label}</div></div>
                    <button onClick={() => handleBuy(model)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-semibold"><ShoppingCart className="w-4 h-4" /> Adquirir</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedFacade && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedFacade(null)}>
          <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">{selectedFacade.name}</h3>
              <button onClick={() => setSelectedFacade(null)} className="text-white p-2">✕</button>
            </div>
            <img src={selectedFacade.url} alt={selectedFacade.name} className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
            <p className="text-gray-400 text-sm text-center mt-4">Fachada del modelo — Al adquirir recibirás todos los archivos.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignGallery;