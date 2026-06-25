import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { receiptAdminService } from '@/lib/receiptAdminService';
import { formatQ } from '@/lib/constructionData';
import { Eye, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Receipt {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  file_url: string;
  file_path: string;
  status: string;
  rejection_reason: string;
  created_at: string;
  constructora_orders?: { customer_name: string; item_name: string; amount: number };
}

interface Props {
  receipts: Receipt[];
  stats: { pending: number; approvedToday: number; rejected: number };
  filter: string;
  onFilterChange: (f: string) => void;
  onRefresh: () => void;
}

const ReceiptsManager: React.FC<Props> = ({ receipts, stats, filter, onFilterChange, onRefresh }) => {
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setActingOn(id);
    await receiptAdminService.approveReceipt(id);
    toast.success('Pago aprobado y producto entregado');
    onRefresh();
    setActingOn(null);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActingOn(rejectModal.id);
    await receiptAdminService.rejectReceipt(rejectModal.id, rejectReason);
    toast.success('Comprobante rechazado');
    setRejectModal({ open: false, id: '' });
    setRejectReason('');
    onRefresh();
    setActingOn(null);
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pendientes', value: stats.pending, color: 'orange' },
          { label: 'Aprobados hoy', value: stats.approvedToday, color: 'green' },
          { label: 'Rechazados', value: stats.rejected, color: 'red' },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-xl border border-${s.color}-200 p-4`}>
            <div className="text-sm text-gray-500">{s.label}</div>
            <div className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => onFilterChange(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === s ? 'bg-[#1a2332] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-400'
            }`}
          >
            {s === 'pending' ? 'Pendientes' : s === 'approved' ? 'Aprobados' : 'Rechazados'}
            {s === 'pending' && stats.pending > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{stats.pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
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
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Acción</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map(r => {
                const order = (r as any).constructora_orders || {};
                return (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
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
                          if (r.file_path) {
                            const url = await supabase.storage.from('payment_receipts').createSignedUrl(r.file_path, 3600);
                            if (url.data) setPreviewUrl(url.data.signedUrl);
                          } else if (r.file_url) {
                            setPreviewUrl(r.file_url);
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
                        r.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {r.status === 'pending' ? 'Pendiente' : r.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleApprove(r.id)}
                            disabled={actingOn === r.id}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 disabled:opacity-50 flex items-center gap-1"
                          >
                            {actingOn === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            Aprobar
                          </button>
                          <button
                            onClick={() => setRejectModal({ open: true, id: r.id })}
                            className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" /> Rechazar
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
                    No hay comprobantes {filter === 'pending' ? 'pendientes' : filter === 'approved' ? 'aprobados' : 'rechazados'}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRejectModal({ open: false, id: '' })}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-[#1a2332]">Rechazar Comprobante</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">El cliente recibirá este motivo y podrá subir un nuevo comprobante.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Motivo del rechazo (visible para el cliente)..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleReject}
                disabled={actingOn === rejectModal.id || !rejectReason.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {actingOn === rejectModal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Rechazar
              </button>
              <button onClick={() => { setRejectModal({ open: false, id: '' }); setRejectReason(''); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-semibold">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="max-w-2xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img src={previewUrl} alt="Comprobante" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" />
            <button onClick={() => setPreviewUrl(null)} className="mt-2 text-white text-sm hover:underline block mx-auto">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptsManager;