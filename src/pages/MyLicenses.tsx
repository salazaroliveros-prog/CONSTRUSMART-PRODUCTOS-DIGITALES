import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { formatQ } from '@/lib/constructionData';
import { Key, Package, ArrowLeft, Copy, CheckCircle2, Loader2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface License {
  id: string;
  order_id: string;
  product_id: string;
  license_key: string;
  status: string;
  expires_at: string;
  max_activations: number;
  activation_count: number;
  created_at: string;
  order?: { item_name: string; amount: number; customer_email: string };
}

const MyLicenses: React.FC = () => {
  const [email, setEmail] = useState('');
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');

  const loadLicenses = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_licenses')
        .select('*, constructora_orders!inner(item_name, amount, customer_email)')
        .eq('constructora_orders.customer_email', email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLicenses(data as unknown as License[] || []);
    } catch (e: any) {
      toast.error('Error al cargar licencias: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    toast.success('Licencia copiada al portapapeles');
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1a2332] text-white py-4">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-3">
          <Link to="/portal" className="text-white/80 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <Key className="w-5 h-5 text-orange-400" />
          <span className="font-bold">Mis Licencias</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-[#1a2332] mb-2">Tus Licencias de Software</h1>
          <p className="text-gray-600 text-sm mb-4">Ingresa tu correo para ver todas tus licencias activas.</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3"
              onKeyDown={e => e.key === 'Enter' && loadLicenses()}
            />
            <button
              onClick={loadLicenses}
              disabled={loading || !email}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
          </div>
        )}

        {!loading && licenses.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{licenses.length} licencia(s) encontrada(s)</p>
            {licenses.map(lic => {
              const order = (lic as any).constructora_orders || {};
              const expired = new Date(lic.expires_at) < new Date();
              return (
                <div key={lic.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-[#1a2332]">{order.item_name || 'Producto'}</h3>
                      <p className="text-xs text-gray-500">Orden #{lic.order_id.slice(0, 8)}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      lic.status === 'active' && !expired
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {expired ? 'Expirada' : lic.status === 'active' ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                    <div className="text-xs text-gray-500 mb-1">Clave de licencia</div>
                    <div className="flex items-center justify-between gap-2">
                      <code className="font-mono text-sm font-bold text-[#1a2332] select-all break-all">
                        {lic.license_key}
                      </code>
                      <button
                        onClick={() => copyKey(lic.license_key)}
                        className="p-2 hover:bg-gray-200 rounded-lg flex-shrink-0"
                        title="Copiar"
                      >
                        {copied === lic.license_key
                          ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                          : <Copy className="w-4 h-4 text-gray-600" />
                        }
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                    <div>
                      <span className="text-gray-400">Activaciones:</span>{' '}
                      <span className="font-medium">{lic.activation_count}/{lic.max_activations}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Expira:</span>{' '}
                      <span className="font-medium">{new Date(lic.expires_at).toLocaleDateString('es-GT')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && licenses.length === 0 && email && (
          <div className="text-center py-12 text-gray-500">
            <Key className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p>No se encontraron licencias para este correo.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyLicenses;