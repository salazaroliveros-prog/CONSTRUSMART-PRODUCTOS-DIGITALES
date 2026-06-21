import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatQ } from '@/lib/constructionData';
import { bankingService } from '@/lib/bankingService';
import {
  LayoutDashboard, ShoppingCart, Calculator, HardHat, ArrowLeft,
  TrendingUp, Users, DollarSign, Package, RefreshCw, LogOut, Building2,
  Plus, Edit2, Trash2, CreditCard, Shield,
} from 'lucide-react';

type Tab = 'overview' | 'orders' | 'quotes' | 'services' | 'leads' | 'banking';

const Admin: React.FC = () => {
  const { logout, user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [orders, setOrders] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [bankingInfo, setBankingInfo] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const [o, q, s, l] = await Promise.all([
      supabase.from('constructora_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('constructora_quotes').select('*').order('created_at', { ascending: false }),
      supabase.from('constructora_service_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('constructora_leads').select('*').order('created_at', { ascending: false }),
    ]);
    setOrders(o.data || []);
    setQuotes(q.data || []);
    setServices(s.data || []);
    setLeads(l.data || []);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
  const paidRevenue = orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + Number(o.amount || 0), 0);
  const totalCustomers = new Set([
    ...orders.map(o => o.customer_email),
    ...services.map(s => s.email),
    ...quotes.map(q => q.email).filter(Boolean),
  ]).size;

  const updateStatus = async (table: string, id: string, status: string) => {
    await supabase.from(table).update({ status }).eq('id', id);
    loadAll();
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1a2332] text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-white/70 hover:text-white flex items-center gap-2 text-sm">
              <ArrowLeft className="w-4 h-4" /> Volver al sitio
            </Link>
            <div className="hidden md:block h-6 w-px bg-white/20" />
            <h1 className="text-xl font-bold">Panel Administrativo</h1>
            <div className="hidden md:block text-xs text-white/50">
              {user?.email}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadAll} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refrescar
            </button>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'orders', label: `Ventas (${orders.length})`, icon: ShoppingCart },
            { id: 'quotes', label: `Cotizaciones (${quotes.length})`, icon: Calculator },
            { id: 'services', label: `Servicios (${services.length})`, icon: HardHat },
            { id: 'leads', label: `Leads (${leads.length})`, icon: Users },
            { id: 'banking', label: 'Datos Bancarios', icon: Building2 },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                tab === t.id ? 'bg-[#1a2332] text-white' : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={DollarSign} label="Ingresos Totales" value={formatQ(totalRevenue)} color="orange" />
              <StatCard icon={TrendingUp} label="Pagados" value={formatQ(paidRevenue)} color="green" />
              <StatCard icon={Package} label="Pedidos" value={String(orders.length)} color="blue" />
              <StatCard icon={Users} label="Clientes" value={String(totalCustomers)} color="purple" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-bold text-[#1a2332] mb-4">Últimas Ventas</h3>
                <div className="space-y-3">
                  {orders.slice(0, 5).map(o => (
                    <div key={o.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                      <div>
                        <div className="font-semibold">{o.item_name}</div>
                        <div className="text-xs text-gray-500">{o.customer_email}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-orange-600">{formatQ(o.amount)}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          o.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>{o.status}</span>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-sm text-gray-500">Sin ventas aún.</p>}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-bold text-[#1a2332] mb-4">Cotizaciones recientes</h3>
                <div className="space-y-3">
                  {quotes.slice(0, 5).map(q => (
                    <div key={q.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                      <div>
                        <div className="font-semibold">{q.name || q.email || 'Anónimo'}</div>
                        <div className="text-xs text-gray-500">{q.department} · {q.square_meters} m²</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-orange-600">{formatQ(Number(q.estimated_avg || 0))}</div>
                        {q.premium_requested && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Premium</span>}
                      </div>
                    </div>
                  ))}
                  {quotes.length === 0 && <p className="text-sm text-gray-500">Sin cotizaciones aún.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <DataTable
            title="Ventas de Productos"
            data={orders}
            columns={[
              { label: 'Fecha', render: o => new Date(o.created_at).toLocaleDateString() },
              { label: 'Cliente', render: o => <div><div className="font-medium">{o.customer_name}</div><div className="text-xs text-gray-500">{o.customer_email}</div></div> },
              { label: 'Producto', render: o => o.item_name },
              { label: 'Monto', render: o => <span className="font-bold text-orange-600">{formatQ(Number(o.amount))}</span> },
              { label: 'Estado', render: o => (
                <select
                  value={o.status}
                  onChange={e => updateStatus('constructora_orders', o.id, e.target.value)}
                  className="border border-gray-200 rounded px-2 py-1 text-xs"
                >
                  <option value="pending">Pendiente</option>
                  <option value="paid">Pagado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              )},
            ]}
          />
        )}

        {tab === 'quotes' && (
          <DataTable
            title="Cotizaciones de Calculadora"
            data={quotes}
            columns={[
              { label: 'Fecha', render: q => new Date(q.created_at).toLocaleDateString() },
              { label: 'Cliente', render: q => <div><div className="font-medium">{q.name}</div><div className="text-xs text-gray-500">{q.email}</div></div> },
              { label: 'Depto', render: q => q.department },
              { label: 'Tipo', render: q => q.construction_type },
              { label: 'Área', render: q => `${q.square_meters} m²` },
              { label: 'Estimado', render: q => <span className="font-bold text-orange-600">{formatQ(Number(q.estimated_avg || 0))}</span> },
              { label: 'Premium', render: q => q.premium_requested ? <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Sí</span> : '—' },
              { label: 'Estado', render: q => (
                <select
                  value={q.status}
                  onChange={e => updateStatus('constructora_quotes', q.id, e.target.value)}
                  className="border border-gray-200 rounded px-2 py-1 text-xs"
                >
                  <option value="new">Nuevo</option>
                  <option value="contacted">Contactado</option>
                  <option value="converted">Convertido</option>
                  <option value="closed">Cerrado</option>
                </select>
              )},
            ]}
          />
        )}

        {tab === 'services' && (
          <DataTable
            title="Solicitudes de Servicios"
            data={services}
            columns={[
              { label: 'Fecha', render: s => new Date(s.created_at).toLocaleDateString() },
              { label: 'Cliente', render: s => <div><div className="font-medium">{s.name}</div><div className="text-xs text-gray-500">{s.email} · {s.phone}</div></div> },
              { label: 'Servicio', render: s => s.service_type },
              { label: 'Depto', render: s => s.department || '—' },
              { label: 'Tamaño', render: s => s.project_size || '—' },
              { label: 'Estado', render: s => (
                <select
                  value={s.status}
                  onChange={e => updateStatus('constructora_service_requests', s.id, e.target.value)}
                  className="border border-gray-200 rounded px-2 py-1 text-xs"
                >
                  <option value="new">Nuevo</option>
                  <option value="contacted">Contactado</option>
                  <option value="in_progress">En proceso</option>
                  <option value="closed">Cerrado</option>
                </select>
              )},
            ]}
          />
        )}

        {tab === 'leads' && (
          <DataTable
            title="Leads de Contacto"
            data={leads}
            columns={[
              { label: 'Fecha', render: l => new Date(l.created_at).toLocaleDateString() },
              { label: 'Nombre', render: l => l.name },
              { label: 'Email', render: l => l.email },
              { label: 'Teléfono', render: l => l.phone || '—' },
              { label: 'Origen', render: l => l.source },
              { label: 'Mensaje', render: l => <div className="max-w-xs truncate text-xs">{l.message}</div> },
            ]}
          />
        )}

        {tab === 'banking' && (
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h3 className="font-bold text-[#1a2332] mb-2 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-500" />
                Configuración de Datos Bancarios
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Estos datos se mostrarán a los clientes cuando realicen una compra. Solo el administrador puede modificar esta información.
              </p>

              {bankingInfo.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
                  No hay datos bancarios configurados. Agrega la información de tu cuenta para comenzar a recibir pagos.
                </div>
              ) : (
                <div className="space-y-4">
                  {bankingInfo.map((bank: any) => (
                    <div key={bank.id} className={`border rounded-lg p-4 ${bank.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className={`w-5 h-5 ${bank.is_active ? 'text-green-600' : 'text-gray-600'}`} />
                          <span className="font-bold text-[#1a2332]">{bank.bank_name}</span>
                          {bank.is_active && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Activo</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => bankingService.toggleBankingInfo(bank.id, !bank.is_active).then(loadAll)}
                            className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300"
                          >
                            {bank.is_active ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => bankingService.deleteBankingInfo(bank.id).then(loadAll)}
                            className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-gray-500">Nombre de cuenta</div>
                          <div className="font-semibold">{bank.account_name}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Número de cuenta</div>
                          <div className="font-mono font-semibold">{bank.account_number}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Tipo de cuenta</div>
                          <div className="capitalize">{bank.account_type}</div>
                        </div>
                        {bank.bank_branch && (
                          <div>
                            <div className="text-xs text-gray-500">Sucursal</div>
                            <div>{bank.bank_branch}</div>
                          </div>
                        )}
                        {bank.nit && (
                          <div className="md:col-span-2">
                            <div className="text-xs text-gray-500">NIT</div>
                            <div className="font-mono">{bank.nit}</div>
                          </div>
                        )}
                        {bank.instructions && (
                          <div className="md:col-span-2">
                            <div className="text-xs text-gray-500">Instrucciones</div>
                            <div>{bank.instructions}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <BankingForm onSuccess={loadAll} />
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: any; label: string; value: string; color: string }> = ({ icon: Icon, label, value, color }) => {
  const colors: Record<string, string> = {
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-[#1a2332]">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
};

const DataTable: React.FC<{ title: string; data: any[]; columns: { label: string; render: (item: any) => React.ReactNode }[] }> = ({ title, data, columns }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100">
      <h3 className="font-bold text-[#1a2332]">{title}</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(c => (
              <th key={c.label} className="text-left px-4 py-3 font-semibold text-gray-700">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={item.id || i} className="border-t border-gray-100 hover:bg-gray-50">
              {columns.map(c => (
                <td key={c.label} className="px-4 py-3">{c.render(item)}</td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-gray-500">Sin registros.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const BankingForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [form, setForm] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    account_type: 'ahorros',
    bank_branch: '',
    nit: '',
    swift_code: '',
    instructions: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await bankingService.addBankingInfo({
      ...form,
      is_active: true,
    });

    if (success) {
      setForm({
        bank_name: '',
        account_name: '',
        account_number: '',
        account_type: 'ahorros',
        bank_branch: '',
        nit: '',
        swift_code: '',
        instructions: '',
      });
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-bold text-[#1a2332] mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-green-500" />
        Agregar Nueva Cuenta Bancaria
      </h3>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Banco *</label>
          <input
            type="text"
            value={form.bank_name}
            onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Cuenta *</label>
          <input
            type="text"
            value={form.account_name}
            onChange={(e) => setForm({ ...form, account_name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cuenta *</label>
          <input
            type="text"
            value={form.account_number}
            onChange={(e) => setForm({ ...form, account_number: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cuenta</label>
          <select
            value={form.account_type}
            onChange={(e) => setForm({ ...form, account_type: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="ahorros">Ahorros</option>
            <option value="monetario">Monetario</option>
            <option value="cheques">Cheques</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
          <input
            type="text"
            value={form.bank_branch}
            onChange={(e) => setForm({ ...form, bank_branch: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">NIT (Empresa)</label>
          <input
            type="text"
            value={form.nit}
            onChange={(e) => setForm({ ...form, nit: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Swift Code</label>
          <input
            type="text"
            value={form.swift_code}
            onChange={(e) => setForm({ ...form, swift_code: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones de Pago</label>
          <textarea
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            rows={3}
            placeholder="Instrucciones adicionales para el cliente (ej: incluya su nombre en la descripción de la transferencia)"
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            {loading ? 'Guardando...' : 'Agregar Cuenta Bancaria'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Admin;
