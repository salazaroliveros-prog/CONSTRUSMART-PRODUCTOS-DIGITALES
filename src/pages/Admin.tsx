import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatQ } from '@/lib/constructionData';
import { bankingService } from '@/lib/bankingService';
import { receiptAdminService } from '@/lib/receiptAdminService';
import { productService } from '@/lib/productService';
import { portfolioService } from '@/lib/portfolioService';
import { toast } from 'sonner';
import {
  LayoutDashboard, ShoppingCart, Calculator, HardHat, ArrowLeft,
  TrendingUp, Users, DollarSign, Package, RefreshCw, LogOut, Building2,
  Plus, Edit2, Trash2, CreditCard, Shield, FileText, CheckCircle2,
  XCircle, Eye, AlertCircle, Loader2, Upload, Box, Briefcase, Image,
} from 'lucide-react';

type Tab = 'overview' | 'orders' | 'quotes' | 'services' | 'leads' | 'banking' | 'receipts' | 'products' | 'portfolio';

const Admin: React.FC = () => {
  const { logout, user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [orders, setOrders] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [bankingInfo, setBankingInfo] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [receiptStats, setReceiptStats] = useState({ pending: 0, approvedToday: 0, rejected: 0 });
  const [receiptFilter, setReceiptFilter] = useState<string>('pending');
  const [rejectModal, setRejectModal] = useState<{ open: boolean; proofId: string }>({ open: false, proofId: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [proofPreviewOpen, setProofPreviewOpen] = useState(false);
  const [actingOnProof, setActingOnProof] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [portfolioProjects, setPortfolioProjects] = useState<any[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    code: '', name: '', category: 'Software', price: 0,
    description: '', features: [] as string[], image_url: '',
    badge: '', file_storage_path: '', is_active: true, sort_order: 0,
  });
  const [featureInput, setFeatureInput] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [portFolioForm, setPortFolioForm] = useState({
    title: '', description: '', category: '', location: '', client_name: '',
    completion_date: '', is_featured: false, sort_order: 0,
  });
  const [portfolioImages, setPortfolioImages] = useState<{ id?: string; url: string; caption: string }[]>([]);
  const [savingPortfolio, setSavingPortfolio] = useState(false);
  const [uploadingPortfolioImage, setUploadingPortfolioImage] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadReceipts = async (statusFilter?: string) => {
    const [list, stats] = await Promise.all([
      receiptAdminService.getPendingReceipts({ status: statusFilter || receiptFilter }),
      receiptAdminService.getReceiptStats(),
    ]);
    setReceipts(list);
    setReceiptStats(stats);
  };

  const loadPortfolio = async () => {
    setPortfolioLoading(true);
    const data = await portfolioService.getAllProjects();
    setPortfolioProjects(data);
    setPortfolioLoading(false);
  };

  const loadProducts = async () => {
    setProductsLoading(true);
    const records = await productService.getAllProducts();
    setProducts(records);
    setProductsLoading(false);
  };

  const loadAll = async () => {
    setLoading(true);
    const [o, q, s, l, b] = await Promise.all([
      supabase.from('constructora_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('constructora_quotes').select('*').order('created_at', { ascending: false }),
      supabase.from('constructora_service_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('constructora_leads').select('*').order('created_at', { ascending: false }),
      bankingService.getAllBankingInfo(),
    ]);
    setOrders(o.data || []);
    setQuotes(q.data || []);
    setServices(s.data || []);
    setLeads(l.data || []);
    setBankingInfo(b || []);
    loadReceipts();
    loadProducts();
    loadPortfolio();
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
            { id: 'receipts', label: `Comprobantes${receiptStats.pending > 0 ? ` (${receiptStats.pending})` : ''}`, icon: FileText },
            { id: 'products', label: `Productos (${products.length})`, icon: Box },
            { id: 'portfolio', label: `Portfolio (${portfolioProjects.length})`, icon: Briefcase },
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

            {/* Charts row */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              {/* Monthly Revenue Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
                <h3 className="font-bold text-[#1a2332] mb-4">Ingresos Mensuales</h3>
                {orders.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={(() => {
                      const months: Record<string, number> = {};
                      orders.forEach(o => {
                        const m = new Date(o.created_at).toLocaleDateString('es-GT', { month: 'short', year: '2-digit' });
                        months[m] = (months[m] || 0) + Number(o.amount || 0);
                      });
                      return Object.entries(months).slice(-6).map(([month, amount]) => ({ month, amount }));
                    })()}>
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

              {/* Orders by Status Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-bold text-[#1a2332] mb-4">Ventas por Estado</h3>
                {orders.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={(() => {
                          const counts: Record<string, number> = {};
                          orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
                          return Object.entries(counts).map(([name, value]) => ({ name, value }));
                        })()}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {['#f97316','#22c55e','#3b82f6','#a855f7','#ef4444','#6b7280'].map(c => <Cell key={c} fill={c} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-400 text-sm">Sin ventas</div>
                )}
              </div>
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
                  <option value="pending_payment">Pendiente de pago</option>
                  <option value="awaiting_validation">En verificacion</option>
                  <option value="paid">Pagado</option>
                  <option value="delivered">Entregado</option>
                  <option value="rejected">Rechazado</option>
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

        {tab === 'receipts' && (
          <div>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-orange-200 p-4">
                <div className="text-sm text-gray-500">Pendientes</div>
                <div className="text-2xl font-bold text-orange-600">{receiptStats.pending}</div>
              </div>
              <div className="bg-white rounded-xl border border-green-200 p-4">
                <div className="text-sm text-gray-500">Aprobados hoy</div>
                <div className="text-2xl font-bold text-green-600">{receiptStats.approvedToday}</div>
              </div>
              <div className="bg-white rounded-xl border border-red-200 p-4">
                <div className="text-sm text-gray-500">Rechazados</div>
                <div className="text-2xl font-bold text-red-600">{receiptStats.rejected}</div>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              {['pending', 'approved', 'rejected'].map(s => (
                <button
                  key={s}
                  onClick={() => { setReceiptFilter(s); loadReceipts(s); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    receiptFilter === s ? 'bg-[#1a2332] text-white' : 'bg-white border border-gray-200 text-gray-700'
                  }`}
                >
                  {s === 'pending' ? 'Pendientes' : s === 'approved' ? 'Aprobados' : 'Rechazados'}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Fecha</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Cliente</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Producto</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Monto</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Comprobante</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Estado</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map(r => {
                      const order = (r as any).constructora_orders || {};
                      return (
                        <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{order.customer_name || '—'}</div>
                            <div className="text-xs text-gray-500">{r.customer_email}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">{order.item_name || '—'}</td>
                          <td className="px-4 py-3 font-bold text-orange-600">{formatQ(Number(order.amount) || 0)}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={async () => {
                                const url = await supabase.storage.from('payment_receipts').createSignedUrl(r.file_path, 3600);
                                if (url.data) {
                                  setProofPreviewUrl(url.data.signedUrl);
                                  setProofPreviewOpen(true);
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> Ver
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              r.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {r.status === 'pending' ? 'Pendiente' : r.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {r.status === 'pending' && (
                              <div className="flex gap-1">
                                <button
                                  onClick={async () => {
                                    setActingOnProof(r.id);
                                    await receiptAdminService.approveReceipt(r.id);
                                    toast.success('Pago aprobado y producto enviado');
                                    loadReceipts();
                                    setActingOnProof(null);
                                  }}
                                  disabled={actingOnProof === r.id}
                                  className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 disabled:opacity-50"
                                >
                                  {actingOnProof === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Aprobar'}
                                </button>
                                <button
                                  onClick={() => setRejectModal({ open: true, proofId: r.id })}
                                  className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}
                            {r.rejection_reason && (
                              <div className="text-xs text-red-600 max-w-[200px] truncate" title={r.rejection_reason}>
                                {r.rejection_reason}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {receipts.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-500">
                          No hay comprobantes {receiptFilter === 'pending' ? 'pendientes' : receiptFilter === 'approved' ? 'aprobados' : 'rechazados'}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reject Modal */}
            {rejectModal.open && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-md w-full p-6">
                  <h3 className="font-bold text-[#1a2332] mb-2">Rechazar Comprobante</h3>
                  <p className="text-sm text-gray-600 mb-4">El cliente recibira este motivo y podra subir un nuevo comprobante.</p>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Motivo del rechazo (visible para el cliente)..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={async () => {
                        if (!rejectReason.trim()) return;
                        setActingOnProof(rejectModal.proofId);
                        await receiptAdminService.rejectReceipt(rejectModal.proofId, rejectReason);
                        toast.success('Comprobante rechazado. Cliente notificado.');
                        setRejectModal({ open: false, proofId: '' });
                        setRejectReason('');
                        loadReceipts();
                        setActingOnProof(null);
                      }}
                      disabled={actingOnProof === rejectModal.proofId || !rejectReason.trim()}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                    <button
                      onClick={() => { setRejectModal({ open: false, proofId: '' }); setRejectReason(''); }}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Proof Preview Modal */}
            {proofPreviewOpen && proofPreviewUrl && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setProofPreviewOpen(false); setProofPreviewUrl(null); }}>
                <div className="max-w-2xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                  <img src={proofPreviewUrl} alt="Comprobante" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" />
                  <button
                    onClick={() => { setProofPreviewOpen(false); setProofPreviewUrl(null); }}
                    className="mt-2 text-white text-sm hover:underline"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1a2332] flex items-center gap-2">
                <Box className="w-5 h-5 text-orange-500" /> Productos Digitales
              </h2>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    code: '', name: '', category: 'Software', price: 0,
                    description: '', features: [], image_url: '',
                    badge: '', file_storage_path: '', is_active: true, sort_order: products.length + 1,
                  });
                  setFeatureInput('');
                  setShowProductModal(true);
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Agregar Producto
              </button>
            </div>

            {productsLoading && products.length === 0 ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Producto</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Categoria</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Precio</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Archivo</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Estado</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Orden</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Accion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-gray-500 font-mono">{p.code}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              p.category === 'Software' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>{p.category}</span>
                          </td>
                          <td className="px-4 py-3 font-bold text-orange-600">{p.price_label || formatQ(Number(p.price))}</td>
                          <td className="px-4 py-3">
                            {p.file_storage_path ? (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Subido
                              </span>
                            ) : (
                              <span className="text-xs text-yellow-600">Sin archivo</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={async () => {
                                await productService.toggleActive(p.id, !p.is_active);
                                loadProducts();
                                toast.success(p.is_active ? 'Producto desactivado' : 'Producto activado');
                              }}
                              className={`text-xs px-2 py-1 rounded-full font-medium ${
                                p.is_active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {p.is_active ? 'Activo' : 'Inactivo'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{p.sort_order}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setProductForm({
                                    code: p.code,
                                    name: p.name,
                                    category: p.category,
                                    price: Number(p.price),
                                    description: p.description,
                                    features: Array.isArray(p.features) ? [...p.features] : [],
                                    image_url: p.image_url || '',
                                    badge: p.badge || '',
                                    file_storage_path: p.file_storage_path || '',
                                    is_active: p.is_active,
                                    sort_order: p.sort_order,
                                  });
                                  setFeatureInput('');
                                  setShowProductModal(true);
                                }}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                              >
                                <Edit2 className="w-3 h-3 inline mr-0.5" /> Editar
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm(`Eliminar "${p.name}"? Esta accion no se puede deshacer.`)) return;
                                  const result = await productService.deleteProduct(p.id);
                                  if (result.success) {
                                    toast.success('Producto eliminado');
                                    loadProducts();
                                  } else {
                                    toast.error(result.error || 'Error al eliminar');
                                  }
                                }}
                                className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                              >
                                <Trash2 className="w-3 h-3 inline mr-0.5" /> Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-500">
                            No hay productos. Agrega tu primer producto.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Product Add/Edit Modal */}
            {showProductModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#1a2332]">
                      {editingProduct ? `Editar: ${editingProduct.name}` : 'Nuevo Producto'}
                    </h3>
                    <button
                      onClick={() => setShowProductModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Codigo *</label>
                      <input
                        type="text"
                        value={productForm.code}
                        onChange={e => setProductForm({ ...productForm, code: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="ej: app-calculo"
                        disabled={!!editingProduct}
                        required
                      />
                      <p className="text-xs text-gray-400 mt-0.5">Identificador unico (no se puede cambiar despues de crear)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                      <input
                        type="text"
                        value={productForm.name}
                        onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="App Calculo y Presupuesto"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                      <select
                        value={productForm.category}
                        onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="Software">Software</option>
                        <option value="Diseno">Diseno</option>
                        <option value="Servicio">Servicio</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Precio (GTQ) *</label>
                      <input
                        type="number"
                        value={productForm.price || ''}
                        onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        min={0}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                      <textarea
                        value={productForm.description}
                        onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        rows={3}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Caracteristicas</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={featureInput}
                          onChange={e => setFeatureInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (featureInput.trim()) {
                                setProductForm({
                                  ...productForm,
                                  features: [...productForm.features, featureInput.trim()],
                                });
                                setFeatureInput('');
                              }
                            }
                          }}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          placeholder="Escribe una caracteristica y presiona Enter"
                        />
                        <button
                          onClick={() => {
                            if (featureInput.trim()) {
                              setProductForm({
                                ...productForm,
                                features: [...productForm.features, featureInput.trim()],
                              });
                              setFeatureInput('');
                            }
                          }}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {productForm.features.map((f, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs">
                            {f}
                            <button
                              onClick={() => {
                                const updated = [...productForm.features];
                                updated.splice(i, 1);
                                setProductForm({ ...productForm, features: updated });
                              }}
                              className="hover:text-red-500"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen</label>
                      <input
                        type="text"
                        value={productForm.image_url}
                        onChange={e => setProductForm({ ...productForm, image_url: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Badge / Etiqueta</label>
                      <select
                        value={productForm.badge}
                        onChange={e => setProductForm({ ...productForm, badge: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">Ninguno</option>
                        <option value="Mas Vendido">Mas Vendido</option>
                        <option value="Premium">Premium</option>
                        <option value="Recomendado">Recomendado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                      <input
                        type="number"
                        value={productForm.sort_order}
                        onChange={e => setProductForm({ ...productForm, sort_order: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        min={0}
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productForm.is_active}
                          onChange={e => setProductForm({ ...productForm, is_active: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Producto activo</span>
                      </label>
                    </div>
                    <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Archivo del producto
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !productForm.code) {
                              toast.error('Primero guarda el codigo del producto');
                              return;
                            }
                            setUploadingFile(true);
                            const path = `product_files/${productForm.code}/${file.name}`;
                            const { error } = await supabase.storage
                              .from('product_files')
                              .upload(path, file, { upsert: true });
                            if (error) {
                              toast.error('Error al subir: ' + error.message);
                            } else {
                              setProductForm({ ...productForm, file_storage_path: path });
                              toast.success('Archivo subido exitosamente');
                            }
                            setUploadingFile(false);
                          }}
                          className="text-sm"
                          disabled={!productForm.code}
                        />
                        {uploadingFile && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
                        {productForm.file_storage_path && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {productForm.file_storage_path}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={async () => {
                        if (!productForm.code || !productForm.name || !productForm.price) {
                          toast.error('Codigo, nombre y precio son obligatorios');
                          return;
                        }
                        setSavingProduct(true);
                        const result = await productService.upsertProduct({
                          ...productForm,
                          id: editingProduct?.id,
                        });
                        if (result.success) {
                          toast.success(editingProduct ? 'Producto actualizado' : 'Producto creado');
                          setShowProductModal(false);
                          loadProducts();
                        } else {
                          toast.error(result.error || 'Error al guardar');
                        }
                        setSavingProduct(false);
                      }}
                      disabled={savingProduct}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      {savingProduct ? 'Guardando...' : editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                    </button>
                    <button
                      onClick={() => setShowProductModal(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {tab === 'portfolio' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1a2332] flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-orange-500" /> Portfolio de Proyectos
              </h2>
              <button
                onClick={() => {
                  setEditingPortfolio(null);
                  setPortFolioForm({ title: '', description: '', category: '', location: '', client_name: '', completion_date: '', is_featured: false, sort_order: portfolioProjects.length + 1 });
                  setPortfolioImages([]);
                  setShowPortfolioModal(true);
                }}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Agregar Proyecto
              </button>
            </div>

            {portfolioLoading && portfolioProjects.length === 0 ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Titulo</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Categoria</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Cliente</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Imagenes</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Destacado</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">Accion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioProjects.map(p => (
                        <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium">{p.title}</div>
                            {p.location && <div className="text-xs text-gray-500">{p.location}</div>}
                          </td>
                          <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{p.category || '—'}</span></td>
                          <td className="px-4 py-3 text-xs text-gray-600">{p.client_name || '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{p.images?.length || 0} imagenes</td>
                          <td className="px-4 py-3">{p.is_featured ? <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Si</span> : <span className="text-xs text-gray-400">No</span>}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingPortfolio(p);
                                  setPortFolioForm({
                                    title: p.title,
                                    description: p.description || '',
                                    category: p.category || '',
                                    location: p.location || '',
                                    client_name: p.client_name || '',
                                    completion_date: p.completion_date ? p.completion_date.slice(0, 10) : '',
                                    is_featured: p.is_featured,
                                    sort_order: p.sort_order,
                                  });
                                  setPortfolioImages((p.images || []).map((img: any) => ({ id: img.id, url: img.image_url, caption: img.caption || '' })));
                                  setShowPortfolioModal(true);
                                }}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                              >
                                <Edit2 className="w-3 h-3 inline mr-0.5" /> Editar
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm(`Eliminar "${p.title}"?`)) return;
                                  const r = await portfolioService.deleteProject(p.id);
                                  if (r.success) { toast.success('Proyecto eliminado'); loadPortfolio(); }
                                  else toast.error(r.error || 'Error');
                                }}
                                className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                              >
                                <Trash2 className="w-3 h-3 inline mr-0.5" /> Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {portfolioProjects.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-500">No hay proyectos. Agrega tu primer proyecto.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {showPortfolioModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#1a2332]">
                      {editingPortfolio ? `Editar: ${editingPortfolio.title}` : 'Nuevo Proyecto'}
                    </h3>
                    <button onClick={() => setShowPortfolioModal(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="w-6 h-6" /></button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
                      <input type="text" value={portFolioForm.title} onChange={e => setPortFolioForm({ ...portFolioForm, title: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                      <textarea value={portFolioForm.description} onChange={e => setPortFolioForm({ ...portFolioForm, description: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                      <input type="text" value={portFolioForm.category} onChange={e => setPortFolioForm({ ...portFolioForm, category: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Construccion, Diseno, Topografia" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ubicacion</label>
                      <input type="text" value={portFolioForm.location} onChange={e => setPortFolioForm({ ...portFolioForm, location: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                      <input type="text" value={portFolioForm.client_name} onChange={e => setPortFolioForm({ ...portFolioForm, client_name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de finalizacion</label>
                      <input type="date" value={portFolioForm.completion_date} onChange={e => setPortFolioForm({ ...portFolioForm, completion_date: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={portFolioForm.is_featured} onChange={e => setPortFolioForm({ ...portFolioForm, is_featured: e.target.checked })} className="rounded" />
                        <span className="text-sm font-medium text-gray-700">Destacado</span>
                      </label>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                        <input type="number" value={portFolioForm.sort_order} onChange={e => setPortFolioForm({ ...portFolioForm, sort_order: Number(e.target.value) })}
                          className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm" min={0} />
                      </div>
                    </div>

                    {/* Portfolio Images */}
                    <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Image className="w-4 h-4" /> Imagenes del proyecto
                      </label>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingPortfolioImage}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingPortfolioImage(true);
                            const path = `portfolio/${Date.now()}_${file.name}`;
                            const { error } = await supabase.storage.from('product_files').upload(path, file, { upsert: true });
                            if (error) {
                              toast.error('Error al subir imagen: ' + error.message);
                            } else {
                              const { data: urlData } = await supabase.storage.from('product_files').createSignedUrl(path, 31536000);
                              setPortfolioImages(prev => [...prev, { url: urlData?.signedUrl || path, caption: '' }]);
                              toast.success('Imagen agregada');
                            }
                            setUploadingPortfolioImage(false);
                          }}
                          className="text-sm"
                        />
                        {uploadingPortfolioImage && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {portfolioImages.map((img, i) => (
                          <div key={i} className="relative group">
                            <img src={img.url} alt="" className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                            <button
                              onClick={() => {
                                if (img.id) portfolioService.deleteImage(img.id);
                                setPortfolioImages(prev => prev.filter((_, idx) => idx !== i));
                              }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={async () => {
                        if (!portFolioForm.title) { toast.error('El titulo es obligatorio'); return; }
                        setSavingPortfolio(true);
                        const r = await portfolioService.upsertProject({
                          ...portFolioForm,
                          completion_date: portFolioForm.completion_date || null,
                          id: editingPortfolio?.id,
                        });
                        if (r.success) {
                          const projectId = r.id || editingPortfolio?.id;
                          if (projectId) {
                            const existingIds = new Set((editingPortfolio?.images || []).map((img: any) => img.id));
                            for (const img of portfolioImages) {
                              if (!img.id && img.url) {
                                await portfolioService.addImage(projectId, img.url, img.caption);
                              }
                            }
                            for (const oldImg of (editingPortfolio?.images || [])) {
                              if (!portfolioImages.find(i => i.id === oldImg.id)) {
                                await portfolioService.deleteImage(oldImg.id);
                              }
                            }
                          }
                          toast.success(editingPortfolio ? 'Proyecto actualizado' : 'Proyecto creado');
                          setShowPortfolioModal(false);
                          loadPortfolio();
                        } else {
                          toast.error(r.error || 'Error al guardar');
                        }
                        setSavingPortfolio(false);
                      }}
                      disabled={savingPortfolio}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      {savingPortfolio ? 'Guardando...' : editingPortfolio ? 'Guardar Cambios' : 'Crear Proyecto'}
                    </button>
                    <button onClick={() => setShowPortfolioModal(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
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

const DataTable: React.FC<{ title: string; data: any[]; columns: { label: string; render: (item: any) => React.ReactNode }[]; pageSize?: number }> = ({ title, data, columns, pageSize = 10 }) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(data.length / pageSize);
  const paginated = data.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-[#1a2332]">{title}</h3>
        <span className="text-xs text-gray-500">{data.length} registros</span>
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
            {paginated.map((item, i) => (
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-xs font-medium rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          <span className="text-xs text-gray-600">
            Página {page + 1} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-xs font-medium rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};

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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await bankingService.addBankingInfo({
      ...form,
      is_active: true,
    });

    if (result.success) {
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
    } else {
      setError(result.error || 'Error al guardar la cuenta bancaria');
    }

    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-bold text-[#1a2332] mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-green-500" />
        Agregar Nueva Cuenta Bancaria
      </h3>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
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
