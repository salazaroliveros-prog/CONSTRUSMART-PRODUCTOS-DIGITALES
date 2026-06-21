import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, CreditCard, Mail, User, Sparkles } from 'lucide-react';
import { formatQ } from '@/lib/constructionData';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const RECOVERY_EMAIL_KEY = 'construsmart_recovery_email';
const RECOVERY_SENT_KEY = 'construsmart_recovery_sent';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, clearCart, isEmpty } = useCart();
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '' });
  const [recoveryEmail, setRecoveryEmail] = useState(() => localStorage.getItem(RECOVERY_EMAIL_KEY) || '');
  const [recoverySaving, setRecoverySaving] = useState(false);
  const recoverySent = localStorage.getItem(RECOVERY_SENT_KEY) === 'true';

  const saveRecoveryEmail = async () => {
    if (!recoveryEmail || !recoveryEmail.includes('@')) {
      toast.error('Ingresa un correo válido');
      return;
    }
    setRecoverySaving(true);
    try {
      localStorage.setItem(RECOVERY_EMAIL_KEY, recoveryEmail);

      await supabase.from('constructora_leads').insert({
        name: '',
        email: recoveryEmail,
        source: 'abandoned-cart',
        message: `Carrito abandonado: ${cart.items.map(i => `${i.name}×${i.quantity}`).join(', ')} — Total: Q${cart.total}`,
      });

      await fetch('https://famous.ai/api/crm/6a1093dc76aee1f11d76c7cd/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recoveryEmail,
          name: '',
          source: 'abandoned-cart',
          tags: ['carrito-abandonado'],
        }),
      });

      localStorage.setItem(RECOVERY_SENT_KEY, 'true');
      toast.success('Te notificaremos cuando haya ofertas especiales para tu carrito.');
    } catch (e) {
      console.error('Error saving recovery email:', e);
    } finally {
      setRecoverySaving(false);
    }
  };

  const handleCheckout = () => {
    if (isEmpty) {
      toast.error('El carrito está vacío');
      return;
    }

    if (!customerInfo.name || !customerInfo.email) {
      toast.error('Completa tu nombre y correo electrónico');
      return;
    }

    sessionStorage.setItem('cart_items', JSON.stringify(cart.items));
    sessionStorage.setItem(
      'checkout_items',
      JSON.stringify(
        cart.items.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price * item.quantity,
          quantity: item.quantity,
          unitPrice: item.price,
          customer: { ...customerInfo },
        }))
      )
    );

    navigate('/checkout');
  };

  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tu carrito está vacío
          </h1>
          <p className="text-gray-600 mb-6">
            Agrega productos digitales para comenzar tu compra
          </p>
          <Link
            to="/#productos"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Ver productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1a2332] text-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="text-white/70 hover:text-white flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver al sitio
          </Link>
          <h1 className="text-xl font-bold">Carrito de Compras</h1>
          <div className="w-20" /> {/* Spacer for balance */}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* Abandoned cart recovery banner */}
        {!recoverySent && (
          <div className="bg-gradient-to-r from-orange-50 via-orange-100 to-yellow-50 border border-orange-200 rounded-xl p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-shrink-0">
                <Mail className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-sm text-[#1a2332]">¿No comprarás ahora?</span>
              </div>
              <div className="flex-1 flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="email"
                  placeholder="Tu correo para recordarte"
                  value={recoveryEmail}
                  onChange={e => setRecoveryEmail(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-0"
                />
                <button
                  onClick={saveRecoveryEmail}
                  disabled={recoverySaving}
                  className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  {recoverySaving ? 'Guardando...' : 'Recordarme'}
                </button>
              </div>
            </div>
            <p className="text-xs text-orange-700 mt-2">
              Te enviaremos un recordatorio y ofertas especiales para que no pierdas tus productos.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Items del carrito */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.category}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-600 p-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-lg font-bold text-orange-600">
                      {formatQ(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-600 text-sm font-medium"
            >
              Vaciar carrito
            </button>
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
              <h2 className="font-bold text-gray-900 mb-4">Resumen del Pedido</h2>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 text-orange-500" /> Tus datos
                </div>
                <input
                  placeholder="Nombre completo *"
                  value={customerInfo.name}
                  onChange={e => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="email"
                  placeholder="Correo electrónico *"
                  value={customerInfo.email}
                  onChange={e => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  placeholder="Teléfono (opcional)"
                  value={customerInfo.phone}
                  onChange={e => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatQ(cart.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío</span>
                  <span className="text-green-600 font-semibold">Gratis</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-bold text-orange-600">{formatQ(cart.total)}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Proceder al Pago
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Pago seguro procesado por Stripe
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cart;