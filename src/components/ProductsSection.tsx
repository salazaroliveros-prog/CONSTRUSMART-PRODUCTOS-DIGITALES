import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DIGITAL_PRODUCTS, formatQ } from '@/lib/constructionData';
import { productService, type ProductRecord } from '@/lib/productService';
import { Check, X, ShoppingBag, Smartphone, Palette, CreditCard, Tag, Star, BarChart3, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFormValidation } from '@/hooks/useValidation';
import { productPurchaseSchema } from '@/lib/validation';
import ProductReviews from '@/components/ProductReviews';
import { promoCodeService } from '@/lib/promoCodeService';
import ProductComparison from '@/components/ProductComparison';
import { ProductGridSkeleton } from '@/components/Skeletons';

const PRODUCT_RATINGS: Record<string, { avg: number; count: number }> = {
  'app-calculo': { avg: 4.5, count: 47 },
  'app-seguimiento': { avg: 4.2, count: 31 },
  'app-rendimiento': { avg: 4.7, count: 23 },
  'erp-completo': { avg: 4.8, count: 15 },
  'diseno-vivienda': { avg: 4.3, count: 28 },
  'planos-presupuesto': { avg: 4.6, count: 42 },
  'render-3d': { avg: 4.9, count: 36 },
};

const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 14 }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.25 && rating - full < 0.75;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`full-${i}`} size={size} className="fill-yellow-400 text-yellow-400" />
      ))}
      {half && <Star key="half" size={size} className="fill-yellow-400/50 text-yellow-400" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`empty-${i}`} size={size} className="text-gray-200" />
      ))}
    </span>
  );
};

const ProductsSection: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState(DIGITAL_PRODUCTS);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selected, setSelected] = useState<typeof DIGITAL_PRODUCTS[0] | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', promoCode: '' });
  const [filter, setFilter] = useState<'all' | 'Software' | 'Diseño'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  
  const { errors, validate, touchField, hasErrors } = useFormValidation(
    productPurchaseSchema,
    form
  );

  // React Query cache for products (stale time: 5 min, cache time: 30 min)
  const { data: cachedProducts, isLoading } = useQuery({
    queryKey: ['active-products'],
    queryFn: async () => {
      const records = await productService.getActiveProducts();
      return records.map(r => ({
        id: r.code,
        name: r.name,
        category: r.category,
        price: r.price,
        priceLabel: r.price_label,
        description: r.description,
        features: r.features,
        image: r.image_url || DIGITAL_PRODUCTS.find(d => d.id === r.code)?.image || '',
        badge: r.badge || undefined,
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    if (cachedProducts) {
      setProducts(cachedProducts.length > 0 ? cachedProducts : DIGITAL_PRODUCTS);
      setLoadingProducts(false);
    }
  }, [cachedProducts]);

  const filtered = products.filter(p => {
    const matchesFilter = filter === 'all' || p.category === filter;
    const matchesSearch = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.features.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleApplyPromoCode = async () => {
    if (!form.promoCode.trim()) {
      toast.error('Por favor ingresa un código promocional');
      return;
    }

    const promoCode = await promoCodeService.validatePromoCode(form.promoCode, selected.price);
    
    if (promoCode) {
      const calculatedDiscount = promoCodeService.calculateDiscount(promoCode, selected.price);
      setDiscount(calculatedDiscount);
      toast.success(`¡Código aplicado! Descuento de Q${calculatedDiscount}`);
    }
  };

  const handleContinueToPayment = () => {
    if (!selected) return;
    
    touchField('name');
    touchField('email');
    
    const validationResult = validate({
      productId: selected.id,
      name: form.name,
      email: form.email,
      phone: form.phone,
    });

    if (!validationResult.success || hasErrors) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    // Opción de agregar al carrito o comprar directamente
    toast.success('¡Producto agregado! Redirigiendo al pago...');

    // Calcular precio final con descuento
    const finalPrice = selected.price - discount;

    // Save to sessionStorage and navigate to checkout
    sessionStorage.setItem(
      'checkout_item',
      JSON.stringify({
        id: selected.id,
        name: selected.name,
        category: selected.category,
        price: finalPrice,
        originalPrice: selected.price,
        discount: discount,
        promoCode: form.promoCode || undefined,
        customer: form,
      })
    );

    // CRM notification (non-blocking, env-configurable)
    const crmUrl = import.meta.env.VITE_CRM_WEBHOOK_URL;
    if (crmUrl) {
      fetch(crmUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          source: 'checkout-started',
          tags: ['checkout', selected.category.toLowerCase()],
        }),
      }).catch(() => {});
    }

    navigate('/checkout');
  };

  return (
    <section id="productos" className="py-20 md:py-28 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Smartphone className="w-4 h-4" />
            Productos Digitales
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#1a2332] mb-4">
            Software & Diseños para Constructores
          </h2>
          <p className="text-gray-600 text-lg">
            Apps, sistemas ERP, planos, presupuestos y renders 3D listos para potenciar tu negocio.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {[
            { id: 'all', label: 'Todos', icon: ShoppingBag },
            { id: 'Software', label: 'Software', icon: Smartphone },
            { id: 'Diseño', label: 'Diseño & Planos', icon: Palette },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition ${
                filter === f.id
                  ? 'bg-[#1a2332] text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-400'
              }`}
            >
              <f.icon className="w-4 h-4" />
              {f.label}
            </button>
          ))}
          <button
            onClick={() => setShowComparison(true)}
            className="px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition"
          >
            <BarChart3 className="w-4 h-4" />
            Comparar
          </button>
        </div>
        
        <div className="max-w-md mx-auto mb-10">
          <input
            type="text"
            placeholder="Buscar productos por nombre, descripción o características..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {loadingProducts || isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                {p.badge && (
                  <span className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {p.badge}
                  </span>
                )}
                <span className="absolute top-3 left-3 bg-white/95 backdrop-blur text-[#1a2332] text-xs font-semibold px-3 py-1 rounded-full">
                  {p.category}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-[#1a2332] mb-2">{p.name}</h3>
                <p className="text-gray-600 text-sm mb-4 flex-1">{p.description}</p>
                <ul className="space-y-1.5 mb-4">
                  {p.features.slice(0, 3).map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-700">
                      <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                
                <div className="flex items-center gap-2 mb-4">
                  <StarRating rating={PRODUCT_RATINGS[p.id]?.avg ?? 4.5} size={14} />
                  <span className="text-xs text-gray-500">
                    {PRODUCT_RATINGS[p.id]?.avg.toFixed(1) ?? '4.5'} ({PRODUCT_RATINGS[p.id]?.count ?? 0})
                  </span>
                </div>

                <div className="flex items-end justify-between mt-auto">
                  <div>
                    <div className="text-xs text-gray-500">Precio</div>
                    <div className="text-2xl font-bold text-orange-600">{p.priceLabel}</div>
                  </div>
                  <button
                    onClick={() => { setSelected(p); setForm({ name: '', email: '', phone: '' }); }}
                    className="bg-[#1a2332] hover:bg-[#243042] text-white px-4 py-2.5 rounded-lg text-sm font-semibold"
                  >
                    Adquirir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Modal: collect customer info, then navigate to /checkout */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold text-[#1a2332] mb-2">{selected.name}</h3>
            <p className="text-gray-600 mb-4 text-sm">{selected.description}</p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-5">
              {discount > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-700">Precio original</span>
                  <span className="text-gray-500 line-through">{formatQ(selected.price)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Subtotal</span>
                <span className="text-gray-700">{formatQ(selected.price - discount)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600 mb-2">
                  <span>Descuento</span>
                  <span>-{formatQ(discount)}</span>
                </div>
              )}
              <div className="text-sm text-gray-700">Total a pagar</div>
              <div className="text-3xl font-bold text-orange-600">{formatQ(selected.price - discount)}</div>
            </div>

            {/* Promo Code Input */}
            <div className="mb-5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Código promocional"
                    value={form.promoCode}
                    onChange={(e) => setForm({ ...form, promoCode: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <button
                  onClick={handleApplyPromoCode}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Aplicar
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Prueba: BIENVENIDO10, CONSTRU50
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <input
                  placeholder="Nombre completo *"
                  className={`w-full border rounded-lg px-4 py-2.5 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  onBlur={() => touchField('name')}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Correo electrónico *"
                  className={`w-full border rounded-lg px-4 py-2.5 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onBlur={() => touchField('email')}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <input
                  placeholder="Teléfono (WhatsApp)"
                  className={`w-full border rounded-lg px-4 py-2.5 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  onBlur={() => touchField('phone')}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <button
                onClick={handleContinueToPayment}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Continuar al Pago
              </button>
              <p className="text-xs text-gray-500 text-center">
                Pago seguro con tarjeta de crédito/débito procesado por Stripe.
              </p>
            </div>
          </div>
        </div>
      )}

      {showComparison && <ProductComparison onClose={() => setShowComparison(false)} />}
    </section>
  );
};

export default ProductsSection;
