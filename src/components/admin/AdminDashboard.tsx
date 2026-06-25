import React from 'react';
import { DollarSign, TrendingUp, Package, Users, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatQ } from '@/lib/constructionData';
import StatCard from './StatCard';

interface AdminDashboardProps {
  orders: any[];
  quotes: any[];
  leads: any[];
  pendingReceipts: number;
  onTabChange: (tab: string) => void;
}

const COLORS = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#6b7280'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ orders, quotes, leads, pendingReceipts, onTabChange }) => {
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
  const paidRevenue = orders.filter(o => o.status === 'paid' || o.status === 'delivered').reduce((sum, o) => sum + Number(o.amount || 0), 0);
  const totalCustomers = new Set([...orders.map(o => o.customer_email), ...leads.map(l => l.email || l.customer_email).filter(Boolean)]).size;

  const revenueByMonth = React.useMemo(() => {
    const months: Record<string, number> = {};
    orders.forEach(o => {
      const m = new Date(o.created_at).toLocaleDateString('es-GT', { month: 'short', year: '2-digit' });
      months[m] = (months[m] || 0) + Number(o.amount || 0);
    });
    return Object.entries(months).slice(-6).map(([month, amount]) => ({ month, amount }));
  }, [orders]);

  const ordersByStatus = React.useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const last5Orders = React.useMemo(() => orders.slice(0, 5), [orders]);
  const last5Quotes = React.useMemo(() => quotes.slice(0, 5), [quotes]);

  return (
    <div>
      {pendingReceipts > 0 && (
        <button
          onClick={() => onTabChange('receipts')}
          className="w-full mb-6 bg-red-50 border border-red-200 rounded-xl px-5 py-4 hover:bg-red-100 transition flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
            <FileText className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-left flex-1">
            <div className="font-bold text-red-800">{pendingReceipts} comprobante(s) pendiente(s) de aprobar</div>
            <div className="text-sm text-red-600">Revisa y aprueba los pagos para entregar los productos automáticamente.</div>
          </div>
          <span className="text-red-600 font-bold text-lg">→</span>
        </button>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Ingresos Totales" value={formatQ(totalRevenue)} color="orange" />
        <StatCard icon={TrendingUp} label="Pagados" value={formatQ(paidRevenue)} color="green" subtitle={paidRevenue > 0 ? `${Math.round((paidRevenue / totalRevenue) * 100)}% del total` : 'Sin pagos'} />
        <StatCard icon={Package} label="Pedidos" value={String(orders.length)} color="blue" subtitle={`${orders.filter(o => o.status === 'pending' || o.status === 'pending_payment').length} pendientes`} />
        <StatCard icon={Users} label="Clientes" value={String(totalCustomers)} color="purple" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
          <h3 className="font-bold text-[#1a2332] mb-4">Ingresos Mensuales</h3>
          {revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `Q${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatQ(v), 'Ingresos']} />
                <Bar dataKey="amount" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm">Sin datos de ingresos</div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-bold text-[#1a2332] mb-4">Ventas por Estado</h3>
          {ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={ordersByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {ordersByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm">Sin ventas</div>
          )}
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {ordersByStatus.map((s, i) => (
              <span key={s.name} className="text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {s.name} ({s.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1a2332]">Últimas Ventas</h3>
            <button onClick={() => onTabChange('orders')} className="text-xs text-orange-600 hover:underline">Ver todas</button>
          </div>
          <div className="space-y-3">
            {last5Orders.map(o => (
              <div key={o.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{o.item_name}</div>
                  <div className="text-xs text-gray-500 truncate">{o.customer_email}</div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-bold text-orange-600">{formatQ(Number(o.amount) || 0)}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    o.status === 'paid' || o.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{o.status}</span>
                </div>
              </div>
            ))}
            {last5Orders.length === 0 && <p className="text-sm text-gray-500">Sin ventas aún.</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#1a2332]">Cotizaciones Recientes</h3>
            <button onClick={() => onTabChange('quotes')} className="text-xs text-orange-600 hover:underline">Ver todas</button>
          </div>
          <div className="space-y-3">
            {last5Quotes.map(q => (
              <div key={q.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{q.name || q.email || 'Anónimo'}</div>
                  <div className="text-xs text-gray-500 truncate">{q.department} · {q.square_meters} m²</div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-bold text-orange-600">{formatQ(Number(q.estimated_avg || 0))}</div>
                  {q.premium_requested && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full block mt-0.5">Premium</span>}
                </div>
              </div>
            ))}
            {last5Quotes.length === 0 && <p className="text-sm text-gray-500">Sin cotizaciones aún.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;