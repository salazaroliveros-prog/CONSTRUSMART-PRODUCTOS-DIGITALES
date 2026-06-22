import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { digitalDeliveryService } from '@/lib/digitalDelivery';
import { receiptService } from '@/lib/receiptService';
import FileUploader from '@/components/FileUploader';
import { formatQ } from '@/lib/constructionData';
import {
  Package, Download, Clock, CheckCircle2, XCircle, AlertCircle,
  ArrowLeft, RefreshCw, Eye, FileText, Key, ExternalLink,
  Loader2, Ban
} from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  item_name: string;
  item_category: string;
  amount: number;
  status: string;
  created_at: string;
}

interface PaymentProof {
  id: string;
  order_id: string;
  file_path: string;
  file_type: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

interface LicenseInfo {
  license_key: string;
  status: string;
  expires_at: string;
  max_activations: number;
  activation_count: number;
}

interface DownloadLink {
  url: string;
  expiresAt: string;
  maxDownloads: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending_payment:     { label: 'Pendiente de pago',     color: 'bg-yellow-100 text-yellow-800 border-yellow-200',     icon: Clock },
  awaiting_validation:{ label: 'En verificacion',        color: 'bg-orange-100 text-orange-800 border-orange-200',    icon: AlertCircle },
  paid:                { label: 'Pagado',                 color: 'bg-blue-100 text-blue-800 border-blue-200',          icon: CheckCircle2 },
  delivered:           { label: 'Entregado',              color: 'bg-green-100 text-green-800 border-green-200',        icon: CheckCircle2 },
  rejected:            { label: 'Comprobante rechazado',  color: 'bg-red-100 text-red-800 border-red-200',              icon: XCircle },
  cancelled:           { label: 'Cancelado',              color: 'bg-gray-100 text-gray-800 border-gray-200',           icon: Ban },
  failed:              { label: 'Fallido',                color: 'bg-red-100 text-red-800 border-red-200',              icon: XCircle },
  refunded:            { label: 'Reembolsado',            color: 'bg-purple-100 text-purple-800 border-purple-200',    icon: RefreshCw },
};

const CustomerPortal: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [otpLockedUntil, setOtpLockedUntil] = useState(0);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [proofs, setProofs] = useState<Record<string, PaymentProof[]>>({});
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [delivering, setDelivering] = useState<string | null>(null);
  const [licenseInfo, setLicenseInfo] = useState<Record<string, LicenseInfo>>({});
  const [downloadLinks, setDownloadLinks] = useState<Record<string, DownloadLink>>({});
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);

  const sendCode = async () => {
    if (!email) return;
    // Rate limiting: 30s cooldown between sends
    if (Date.now() < otpCooldown) {
      const remaining = Math.ceil((otpCooldown - Date.now()) / 1000);
      toast.error(`Espera ${remaining}s antes de solicitar otro código`);
      return;
    }
    // Lock after 5 attempts
    if (otpAttempts >= 5) {
      const lockedUntil = Date.now() + 15 * 60 * 1000; // 15 min
      setOtpLockedUntil(lockedUntil);
      toast.error('Demasiados intentos. Intenta de nuevo en 15 minutos.');
      return;
    }
    if (Date.now() < otpLockedUntil) {
      const remaining = Math.ceil((otpLockedUntil - Date.now()) / 60000);
      toast.error(`Cuenta bloqueada. Intenta de nuevo en ${remaining} minuto(s).`);
      return;
    }
    setSendingCode(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setCodeSent(true);
      setOtpCooldown(Date.now() + 30000); // 30s cooldown
      setOtpAttempts(prev => prev + 1);
      toast.success('Código enviado a ' + email);
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setSendingCode(false);
    }
  };

  const verifyCode = async () => {
    if (!code || !email) return;
    // Check lock
    if (Date.now() < otpLockedUntil) {
      toast.error('Cuenta bloqueada temporalmente por seguridad.');
      return;
    }
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) throw error;
      setIsLoggedIn(true);
      setOtpAttempts(0);
      loadOrders();
    } catch (e: any) {
      setOtpAttempts(prev => prev + 1);
      if (otpAttempts >= 4) {
        setOtpLockedUntil(Date.now() + 15 * 60 * 1000);
        toast.error('Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.');
      } else {
        toast.error('Código incorrecto. Intento ' + (otpAttempts + 1) + ' de 5.');
      }
    } finally {
      setVerifying(false);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email || email;

      const { data, error } = await supabase
        .from('constructora_orders')
        .select('*')
        .eq('customer_email', userEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (e: any) {
      console.error('Error loading orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadOrders();
    }
  }, [isLoggedIn]);

  const toggleOrder = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    setExpandedOrder(orderId);

    const proofsData = await receiptService.getReceipts(orderId);
    setProofs(prev => ({ ...prev, [orderId]: proofsData }));
    if (proofsData.length > 0) {
      const url = await receiptService.getReceiptUrl(proofsData[0].file_path);
      if (url) setProofUrls(prev => ({ ...prev, [proofsData[0].id]: url }));
    }

    const { data: licenses } = await supabase
      .from('product_licenses')
      .select('*')
      .eq('order_id', orderId);
    if (licenses?.length) {
      setLicenseInfo(prev => ({ ...prev, [orderId]: licenses[0] }));
    }

    const { data: dl } = await supabase
      .from('download_links')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1);
    if (dl?.length) {
      setDownloadLinks(prev => ({
        ...prev,
        [orderId]: {
          url: `${import.meta.env.VITE_APP_URL || 'http://localhost:8080'}/download/${dl[0].token}`,
          expiresAt: dl[0].expires_at,
          maxDownloads: dl[0].max_downloads,
        }
      }));
    }
  };

  const handleUploadReceipt = async (orderId: string, file: File) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, error: 'Orden no encontrada.' };
    const result = await receiptService.uploadReceipt(orderId, order.customer_email, file);
    if (result.success) {
      toast.success('Comprobante subido exitosamente');
      loadOrders();
      const proofsData = await receiptService.getReceipts(orderId);
      setProofs(prev => ({ ...prev, [orderId]: proofsData }));
    }
    return result;
  };

  const handleGenerateLink = async (orderId: string) => {
    setGeneratingLink(orderId);
    try {
      const link = await digitalDeliveryService.generateDownloadLink(orderId);
      if (link) {
        setDownloadLinks(prev => ({ ...prev, [orderId]: link }));
        toast.success('Enlace de descarga generado');
      } else {
        toast.error('Error al generar enlace');
      }
    } catch {
      toast.error('Error al generar enlace');
    } finally {
      setGeneratingLink(null);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-[#1a2332] text-white py-4">
          <div className="max-w-md mx-auto px-4 flex items-center gap-3">
            <Link to="/" className="text-white/80 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
            <span className="font-bold">Portal del Cliente</span>
          </div>
        </header>
        <main className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="text-center mb-6">
              <Package className="w-12 h-12 text-orange-500 mx-auto mb-3" />
              <h1 className="text-2xl font-bold text-[#1a2332]">Mis Pedidos</h1>
              <p className="text-gray-600 text-sm mt-1">Ingresa tu correo para ver tus pedidos y descargas.</p>
            </div>

            {!codeSent ? (
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Tu correo electronico"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                {otpAttempts > 0 && (
                  <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Intentos realizados: {otpAttempts}/5. Después de 5 intentos, la cuenta se bloqueará 15 minutos.
                  </div>
                )}
                <button
                  onClick={sendCode}
                  disabled={sendingCode || !email || Date.now() < otpCooldown}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {sendingCode ? 'Enviando...' : Date.now() < otpCooldown ? 'Espera 30s...' : 'Enviar código de acceso'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Te enviamos un codigo a <strong>{email}</strong></p>
                <input
                  type="text"
                  placeholder="Codigo de 6 digitos"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-lg tracking-widest"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  maxLength={6}
                />
                <button
                  onClick={verifyCode}
                  disabled={verifying || code.length < 6}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {verifying ? 'Verificando...' : 'Verificar codigo'}
                </button>
                <button
                  onClick={() => { setCodeSent(false); setCode(''); }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  Cambiar correo
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1a2332] text-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-white/80 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
            <span className="font-bold">Portal del Cliente</span>
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => { setIsLoggedIn(false); setOrders([]); })}
            className="text-sm text-white/70 hover:text-white"
          >
            Cerrar sesion
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <h1 className="text-2xl font-bold text-[#1a2332] mb-6">Mis Pedidos</h1>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No tienes pedidos registrados con este correo.</p>
            <Link to="/" className="inline-block mt-4 text-orange-600 hover:text-orange-700 font-semibold">
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment;
              const StatusIcon = cfg.icon;
              const orderProofs = proofs[order.id] || [];
              const latestProof = orderProofs[0];
              const isExpanded = expandedOrder === order.id;

              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleOrder(order.id)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1a2332] truncate">{order.item_name || 'Producto'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
                      <div className="flex items-center gap-1">
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{cfg.label}</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-orange-600">{formatQ(order.amount)}</div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50/50">
                      {/* Pending payment: upload receipt */}
                      {(order.status === 'pending_payment') && (
                        <div>
                          <h4 className="font-semibold text-sm text-[#1a2332] mb-2">Subir comprobante de pago</h4>
                          <FileUploader
                            onUpload={async (file) => handleUploadReceipt(order.id, file)}
                          />
                        </div>
                      )}

                      {/* Awaiting validation: show receipt preview */}
                      {(order.status === 'awaiting_validation') && latestProof && (
                        <div>
                          <h4 className="font-semibold text-sm text-[#1a2332] mb-2">Comprobante enviado</h4>
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <p className="text-sm text-orange-800">
                              <AlertCircle className="w-4 h-4 inline mr-1" />
                              Tu comprobante esta siendo revisado. Te notificaremos cuando sea aprobado.
                            </p>
                            {proofUrls[latestProof.id] && (
                              <a
                                href={proofUrls[latestProof.id]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-orange-700 mt-2 hover:underline"
                              >
                                <Eye className="w-3.5 h-3.5" /> Ver comprobante
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Rejected: show reason + re-upload */}
                      {(order.status === 'rejected') && (
                        <div>
                          {latestProof?.rejection_reason && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                              <p className="text-xs text-red-700 font-semibold">Motivo del rechazo:</p>
                              <p className="text-sm text-red-800 mt-1">{latestProof.rejection_reason}</p>
                            </div>
                          )}
                          <h4 className="font-semibold text-sm text-[#1a2332] mb-2">Subir nuevo comprobante</h4>
                          <FileUploader
                            onUpload={async (file) => handleUploadReceipt(order.id, file)}
                          />
                        </div>
                      )}

                      {/* Paid or Delivered: download */}
                      {(order.status === 'paid' || order.status === 'delivered') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Download link */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <h4 className="font-semibold text-sm text-[#1a2332] mb-1">Descarga</h4>
                            {downloadLinks[order.id] ? (
                              <a
                                href={downloadLinks[order.id].url}
                                className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline"
                              >
                                <Download className="w-4 h-4" /> Descargar producto
                              </a>
                            ) : (
                              <button
                                onClick={() => handleGenerateLink(order.id)}
                                disabled={generatingLink === order.id}
                                className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline disabled:opacity-50"
                              >
                                {generatingLink === order.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4" />
                                )}
                                Obtener enlace de descarga
                              </button>
                            )}
                            {downloadLinks[order.id] && (
                              <p className="text-xs text-gray-500 mt-1">
                                Expira: {new Date(downloadLinks[order.id].expiresAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          {/* License key */}
                          {licenseInfo[order.id] && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <h4 className="font-semibold text-sm text-[#1a2332] mb-1 flex items-center gap-1">
                                <Key className="w-4 h-4 text-green-600" /> Licencia
                              </h4>
                              <div className="bg-white border border-green-300 rounded px-2 py-1 font-mono text-xs text-green-900 select-all">
                                {licenseInfo[order.id].license_key}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Activaciones: {licenseInfo[order.id].activation_count}/{licenseInfo[order.id].max_activations}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Order details */}
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Orden: #{order.id.slice(0, 8)}</p>
                        <p>Categoria: {order.item_category}</p>
                        <p>Monto: {formatQ(order.amount)}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-orange-600 hover:text-orange-700 font-semibold">
            ← Volver a la tienda
          </Link>
        </div>
      </main>
    </div>
  );
};

export default CustomerPortal;
