import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { formatQ, DIGITAL_PRODUCTS } from '@/lib/constructionData';
import { trialService, type ProductDemo } from '@/lib/trialService';
import { Check, X, ShoppingBag, Sparkles, Eye, Play, FileText, ExternalLink, Clock, ArrowLeft, Star, Loader2, CreditCard, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface ProductWithDetails {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  priceLabel: string;
  description: string;
  features: string[];
  image: string;
  badge?: string;
  hasTrial: boolean;
  trialDays: number;
  demoUrl: string;
}

const PRODUCT_RATINGS: Record<string, { avg: number; count: number }> = {
  'app-calculo': { avg: 4.5, count: 47 },
  'app-seguimiento': { avg: 4.2, count: 31 },
  'app-rendimiento': { avg: 4.7, count: 23 },
  'erp-completo': { avg: 4.8, count: 15 },
  'diseno-vivienda': { avg: 4.3, count: 28 },
  'planos-presupuesto': { avg: 4.6, count: 42 },
  'render-3d': { avg: 4.9, count: 36 },
};

const CATEGORY_META: Record<string, { title: string; description: string; icon: string }> = {
  Software: { title: 'Software para Construcción', description: 'Apps, sistemas ERP y herramientas digitales para profesionales de la construcción', icon: '💻' },
  Diseno: { title: 'Diseños y Planos', description: 'Planos arquitectónicos, presupuestos, renders 3D y diseños personalizados', icon: '📐' },
  Servicio: { title: 'Servicios Profesionales', description: 'Consultoría, supervisión y servicios especializados para tu proyecto', icon: '🔧' },
};

const ProductLibrary: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDetails | null>(null);
  const [showTrialForm, setShowTrialForm] = useState(false);
  const [trialEmail, setTrialEmail] = useState('');
  const [trialName, setTrialName] = useState('');
  const [startingTrial, setStartingTrial] = useState(false);
  const [demos, setDemos] = useState<ProductDemo[]>([]);
  const [activeDemo, setActiveDemo] = useState<ProductDemo | null>(null);

  const activeCategory = category && CATEGORY_META[category] ? category : 'Software';
  const meta = CATEGORY_META[activeCategory] || CATEGORY_META.Software;

  useEffect(() => {
    loadProducts();
  }, [activeCategory]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // Try loading from Supabase first
      const { data: records } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('category', activeCategory)
        .order('sort_order');

      if (records && records.length > 0) {
        setProducts(records.map(r => ({
          id: r.code,
          code: r.code,
          name: r.name,
          category: r.category,
          price: r.price,
          priceLabel: r.price_label || formatQ(r.price),
          description: r.description,
          features: r.features || [],
          image: r.image_url || DIGITAL_PRODUCTS.find(d => d.id === r.code)?.image || '',
          badge: r.badge || undefined,
          hasTrial: r.has_trial || false,
          trialDays: r.trial_days || 30,
          demoUrl: r.demo_url || '',
        })));
      } else {
        // Fallback to static data
        const staticProducts = DIGITAL_PRODUCTS
          .filter(p => p.category === activeCategory)
          .map(p => ({
            ...p,
            code: p.id,
            hasTrial: true,
            trialDays: 30,
            demoUrl: '',
          }));
        setProducts(staticProducts);
      }
    } catch {
      // Fallback
      const staticProducts = DIGITAL_PRODUCTS
        .filter(p => p.category === activeCategory)
        .map(p => ({ ...p, code: p.id, hasTrial: true, trialDays: 30, demoUrl: '' }));
      setProducts(staticProducts);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDemo = async (product: ProductWithDetails) => {
    setSelectedProduct(product);
    setDemos([]);
    setActiveDemo(null);

    const productDemos = await trialService.getProductDemos(product.code);
    if (productDemos.length > 0) {
      setDemos(productDemos);
      setActiveDemo(productDemos[0]);
    } else {
      // If no demos in DB, show placeholder based on product
      const placeholderDemos: ProductDemo[] = [
        {
          id: 'placeholder-1',
          product_code: product.code,
          type: 'screenshot',
          url: product.image,
          caption: `Vista previa de ${product.name}`,
          sort_order: 0,
        },
      ];
      setDemos(placeholderDemos);
      setActiveDemo(placeholderDemos[0]);
    }
  };

  const handleStartTrial = async () => {
    if (!trialEmail || !trialName || !selectedProduct) {
      toast.error('Completa tu nombre y correo');
      return;
    }
    if (!trialEmail.includes('@')) {
      toast.error('Correo inválido');
      return;
    }

    setStartingTrial(true);
    const result = await trialService.startTrial(trialEmail, selectedProduct.code, selectedProduct.name);
    
    if ('error' in result) {
      toast.error(result.error);
    } else {
      toast.success(`¡Trial iniciado! Tienes ${selectedProduct.trialDays} días gratis.`);
      setShowTrialForm(false);
      // Save to session storage that user has active trial
      sessionStorage.setItem(`trial_${selectedProduct.code}`, JSON.stringify({
        email: trialEmail,
        name: trialName,
        expires_at: result.expires_at,
      }));
      // Redirect to the demo/product
      if (selectedProduct.demoUrl) {
        window.open(selectedProduct.demoUrl, '_blank');
      }
    }
    setStartingTrial(false);
  };

  const handleBuy = (product: ProductWithDetails) => {
    // Store in cart and navigate
    sessionStorage.setItem('checkout_item', JSON.stringify({
      id: product.code,
      name: product.name,
      category: product.category,
      price: product.price,
      customer: { name: '', email: '' },
    }));
    navigate('/checkout');
  };

  const renderDemoViewer = () => {
    if (!activeDemo) return null;
    
    if (activeDemo.type === 'video') {
      return (
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={activeDemo.url}
            className="w-full h-full"
            allow="accelerometer; autoplay; encrypted-media; gyroscope"
            allowFullScreen
            title={activeDemo.caption}
          />
        </div>
      );
    }
    
    if (activeDemo.type === 'demo_url') {
      return (
        <div className="text-center py-12 bg-gray-100 rounded-lg">
          <ExternalLink className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold mb-2">Demo interactiva disponible</p>
          <a
            href={activeDemo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir demo
          </a>
        </div>
      );
    }

    if (activeDemo.type === 'pdf_preview') {
      return (
        <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
          <iframe src={activeDemo.url} className="w-full h-full" title={activeDemo.caption} />
        </div>
      );
    }

    // Default: screenshot/image
    return (
      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
        <img src={activeDemo.url} alt={activeDemo.caption} className="w-full h-full object-contain" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1a2332] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="text-white/70 hover:text-white flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <h1 className="text-lg font-bold">{meta.icon} {meta.title}</h1>
          <Link to="/cart" className="text-white/70 hover:text-white">
            <ShoppingBag className="w-5 h-5" />
          </Link>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 pb-4">
          <p className="text-gray-400 text-sm">{meta.description}</p>
        </div>
        {/* Category tabs */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 pb-4 flex gap-2 overflow-x-auto">
          {Object.entries(CATEGORY_META).map(([key, val]) => (
            <button
              key={key}
              onClick={() => navigate(`/products/${key}`)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                activeCategory === key
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              {val.icon} {key}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-gray-500">Cargando productos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-xl font-semibold text-gray-700 mb-2">No hay productos en esta categoría</p>
            <p>Pronto agregaremos más productos para {activeCategory.toLowerCase()}.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col">
                {/* Image */}
                <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  {p.badge && (
                    <span className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">{p.badge}</span>
                  )}
                  {p.hasTrial && (
                    <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Trial {p.trialDays}d
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-[#1a2332] mb-2">{p.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 flex-1">{p.description}</p>
                  
                  {/* Features */}
                  <ul className="space-y-1.5 mb-4">
                    {(p.features || []).slice(0, 3).map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-700">
                        <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className={i < Math.floor(PRODUCT_RATINGS[p.code]?.avg || 4.5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                    ))}
                    <span className="text-xs text-gray-500">({PRODUCT_RATINGS[p.code]?.count || 0})</span>
                  </div>

                  {/* Price + Actions */}
                  <div className="text-2xl font-bold text-orange-600 mb-4">{p.priceLabel || formatQ(p.price)}</div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDemo(p)}
                      className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-[#1a2332] text-[#1a2332] px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50"
                    >
                      <Eye className="w-4 h-4" />
                      Demo
                    </button>
                    {p.hasTrial && (
                      <button
                        onClick={() => { setSelectedProduct(p); setShowTrialForm(true); setTrialEmail(''); setTrialName(''); }}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2.5 rounded-lg text-sm font-semibold"
                      >
                        <Sparkles className="w-4 h-4" />
                        Probar
                      </button>
                    )}
                    <button
                      onClick={() => handleBuy(p)}
                      className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2.5 rounded-lg text-sm font-semibold"
                    >
                      <CreditCard className="w-4 h-4" />
                      Comprar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Demo Modal */}
      {selectedProduct && !showTrialForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => { setSelectedProduct(null); setActiveDemo(null); }}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="font-bold text-lg text-[#1a2332]">{selectedProduct.name}</h2>
                <p className="text-xs text-gray-500">{selectedProduct.category}</p>
              </div>
              <button onClick={() => { setSelectedProduct(null); setActiveDemo(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Demo viewer */}
              {renderDemoViewer()}

              {/* Demo thumbnails */}
              {demos.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {demos.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setActiveDemo(d)}
                      className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition ${
                        activeDemo?.id === d.id ? 'border-orange-500' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {d.type === 'video' ? (
                        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                          <Play className="w-5 h-5 text-white" />
                        </div>
                      ) : d.type === 'pdf_preview' ? (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-gray-600" />
                        </div>
                      ) : (
                        <img src={d.url} alt={d.caption} className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-sm text-gray-600 mt-4">{activeDemo?.caption || selectedProduct.description}</p>

              {/* Quick actions */}
              <div className="flex gap-3 mt-6">
                {selectedProduct.hasTrial && (
                  <button
                    onClick={() => { setShowTrialForm(true); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold"
                  >
                    <Sparkles className="w-5 h-5" />
                    Probar gratis {selectedProduct.trialDays} días
                  </button>
                )}
                <button
                  onClick={() => handleBuy(selectedProduct)}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold"
                >
                  <CreditCard className="w-5 h-5" />
                  Comprar {selectedProduct.priceLabel || formatQ(selectedProduct.price)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trial Form Modal */}
      {showTrialForm && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-500" />
                <h3 className="font-bold text-lg">Probar {selectedProduct.name}</h3>
              </div>
              <button onClick={() => setShowTrialForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm font-semibold">🎉 Acceso gratuito por {selectedProduct.trialDays} días</p>
              <p className="text-green-700 text-xs mt-1">Sin compromiso. Después del trial, puedes comprar la versión premium.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre completo</label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={trialName}
                  onChange={e => setTrialName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Correo electrónico</label>
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={trialEmail}
                  onChange={e => setTrialEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                />
              </div>
              <button
                onClick={handleStartTrial}
                disabled={startingTrial}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {startingTrial ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {startingTrial ? 'Iniciando...' : `Iniciar prueba gratuita`}
              </button>
              <p className="text-xs text-gray-500 text-center">
                <Shield className="w-3 h-3 inline" /> Tus datos están seguros. No compartiremos tu correo.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductLibrary;