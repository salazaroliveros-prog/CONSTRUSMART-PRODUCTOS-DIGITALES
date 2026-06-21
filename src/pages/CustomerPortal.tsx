import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { digitalDeliveryService } from '@/lib/digitalDelivery';
import { User, ShoppingBag, Download, LogOut, Package, Clock, Mail, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerOrder {
  id: string;
  item_name: string;
  item_category: string;
  amount: number;
  status: string;
  created_at: string;
}

const SESSION_KEY = 'construsmart_portal_session';

interface PortalSession {
  email: string;
  name: string;
  expiresAt: number;
}

const CustomerPortal: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'login' | 'orders'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadLinks, setDownloadLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const session: PortalSession = JSON.parse(raw);
        if (session.expiresAt > Date.now()) {
          setEmail(session.email);
          setName(session.name);
          loadOrders(session.email);
          setStep('orders');
        } else {
          sessionStorage.removeItem(SESSION_KEY);
        }
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const loadOrders = async (emailAddr: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('constructora_orders')
        .select('*')
        .eq('customer_email', emailAddr)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Error al cargar tus pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Ingresa un correo válido');
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('constructora_orders')
        .select('customer_name, customer_email')
        .eq('customer_email', email)
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        const { data: leads } = await supabase
          .from('constructora_leads')
          .select('name')
          .eq('email', email)
          .limit(1);

        if (!leads || leads.length === 0) {
          toast.error('No encontramos pedidos con este correo. ¿Has realizado alguna compra?');
          setLoading(false);
          return;
        }
      }

      const customerName = data?.[0]?.customer_name || name || email.split('@')[0];

      const session: PortalSession = {
        email,
        name: customerName,
        expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

      setName(customerName);
      await loadOrders(email);
      setStep('orders');
      toast.success(`Bienvenido, ${customerName}`);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Error al verificar tu correo');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = useCallback(async (orderId: string, productName: string) => {
    try {
      const downloadLink = await digitalDeliveryService.generateDownloadLink(orderId);
      if (downloadLink) {
        setDownloadLinks(prev => ({ ...prev, [orderId]: downloadLink.url }));
        toast.success('Enlace de descarga generado');
      } else {
        toast.error('Error al generar enlace de descarga');
      }
    } catch (error) {
      console.error('Error generating download link:', error);
      toast.error('Error al generar enlace de descarga');
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setStep('login');
    setOrders([]);
    setEmail('');
    setName('');
    toast.success('Sesión cerrada');
  };

  if (step === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#1a2332] mb-2">Portal de Clientes</h1>
            <p className="text-gray-600 text-sm mb-6">
              Ingresa tu correo para ver tus pedidos y descargas.
            </p>
            <div className="space-y-3 text-left">
              <input
                type="email"
                placeholder="Tu correo electrónico"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                autoFocus
              />
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Verificando...' : <><Mail className="w-5 h-5" /> Ingresar</>}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Usamos el correo con el que realizaste tu compra. Sin contraseñas.
            </p>
            <Link to="/" className="block mt-4 text-sm text-orange-600 hover:text-orange-700">
              Volver al sitio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando tus pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1a2332] text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white">
            <Package className="w-5 h-5" />
            <span className="font-semibold">Portal de Clientes</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/referrals"
              className="flex items-center gap-2 text-sm hover:text-orange-400 transition"
            >
              <ArrowRight className="w-4 h-4" />
              Referidos
            </Link>
            <span className="text-sm text-white/70">{email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm hover:text-orange-400 transition"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a2332] mb-2">Mis Compras</h1>
          <p className="text-gray-600">Gestiona tus productos digitales y descargas</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Total Pedidos</span>
            </div>
            <div className="text-2xl font-bold text-[#1a2332]">{orders.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-600">Entregados</span>
            </div>
            <div className="text-2xl font-bold text-[#1a2332]">
              {orders.filter(o => o.status === 'paid').length}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm text-gray-600">Pendientes</span>
            </div>
            <div className="text-2xl font-bold text-[#1a2332]">
              {orders.filter(o => o.status === 'pending').length}
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes compras aún</h3>
            <p className="text-gray-600 mb-6">Explora nuestros productos digitales para comenzar</p>
            <Link
              to="/#productos"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              <Package className="w-5 h-5" />
              Ver Productos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-[#1a2332]">{order.item_name}</h3>
                        <p className="text-sm text-gray-500">{order.item_category}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-gray-600">
                            Fecha: {new Date(order.created_at).toLocaleDateString('es-GT')}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status === 'paid' ? 'Pagado' : order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {order.status === 'paid' && (
                      <>
                        {downloadLinks[order.id] ? (
                          <a
                            href={downloadLinks[order.id]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                          >
                            <Download className="w-4 h-4" />
                            Descargar
                          </a>
                        ) : (
                          <button
                            onClick={() => handleDownload(order.id, order.item_name)}
                            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                          >
                            <Download className="w-4 h-4" />
                            Obtener Enlace
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerPortal;
