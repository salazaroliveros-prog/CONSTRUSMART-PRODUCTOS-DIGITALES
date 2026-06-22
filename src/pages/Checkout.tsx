import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { formatQ } from '@/lib/constructionData';
import { bankingService } from '@/lib/bankingService';
import { receiptService } from '@/lib/receiptService';
import { internalCrm } from '@/lib/internalCrm';
import FileUploader from '@/components/FileUploader';
import { ArrowLeft, Lock, ShieldCheck, CheckCircle2, Building2, Copy, AlertCircle, Package, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface CheckoutItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  unitPrice: number;
  promoCode?: string;
  customer: { name: string; email: string; phone: string };
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [bankingInfo, setBankingInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [orderIds, setOrderIds] = useState<string[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem('checkout_items');
    const singleRaw = sessionStorage.getItem('checkout_item');

    let parsedItems: CheckoutItem[] = [];

    if (raw) {
      parsedItems = JSON.parse(raw);
    } else if (singleRaw) {
      const single = JSON.parse(singleRaw);
      parsedItems = [{
        ...single,
        quantity: single.quantity || 1,
        unitPrice: single.originalPrice || single.price,
      }];
    }

    if (parsedItems.length === 0) {
      navigate('/');
      return;
    }
    setItems(parsedItems);
    loadBankingInfo();
  }, [navigate]);

  const loadBankingInfo = async () => {
    const info = await bankingService.getActiveBankingInfo();
    setBankingInfo(info);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

  const copyAccountNumber = () => {
    if (bankingInfo?.account_number) {
      navigator.clipboard.writeText(bankingInfo.account_number);
      setCopied('account_number');
      toast.success('Número de cuenta copiado');
      setTimeout(() => setCopied(''), 2000);
    }
  };

  const confirmPayment = async () => {
    if (items.length === 0) return;
    setLoading(true);

    try {
      const customer = items[0].customer;
      const createdIds: string[] = [];

      for (const item of items) {
        let productId: string | null = null;
        const { data: product } = await supabase
          .from('products')
          .select('id')
          .eq('code', item.id)
          .maybeSingle();
        if (product) productId = product.id;

        const { data: order, error } = await supabase
          .from('constructora_orders')
          .insert({
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: customer.phone,
            item_type: 'producto_digital',
            item_name: `${item.name}${item.quantity > 1 ? ` × ${item.quantity}` : ''}`,
            item_category: item.category,
            amount: item.price,
            currency: 'GTQ',
            status: 'pending_payment',
            product_id: productId,
            notes: `Multi-item order. Qty: ${item.quantity}${item.promoCode ? `, promo: ${item.promoCode}` : ''}`,
          })
          .select('id')
          .single();

        if (error) throw error;
        createdIds.push(order!.id);
      }

      setOrderIds(createdIds);
      setPaymentConfirmed(true);

      // Internal CRM: create lead + schedule follow-up
      internalCrm.createLead({
        type: 'checkout',
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        source: 'checkout',
        details: `Productos: ${items.map(i => i.name).join(', ')} — Total: Q${totalAmount}`,
        value: totalAmount,
      });

      sessionStorage.removeItem('checkout_items');
      sessionStorage.removeItem('checkout_item');
      sessionStorage.removeItem('cart_items');

      toast.success('Órdenes registradas. Completa la transferencia para recibir tus productos.');
    } catch (e: any) {
      console.error('Error confirming payment:', e);
      toast.error('Error al registrar las órdenes. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (paymentConfirmed && items.length > 0 && orderIds.length > 0) {
    const customer = items[0].customer;
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a2332] mb-2">¡Órdenes Registradas!</h1>
          <p className="text-gray-600 mb-6">
            Gracias {customer.name}, {orderIds.length > 1 ? 'tus órdenes' : 'tu orden'}
            {orderIds.length > 1 ? (
              <span className="block mt-1 font-mono text-xs text-gray-500 space-x-2">
                {orderIds.map(id => <span key={id} className="bg-gray-100 px-2 py-0.5 rounded">#{id.slice(0, 8)}</span>)}
              </span>
            ) : (
              <span className="font-mono text-sm mx-1">#{orderIds[0].slice(0, 8)}</span>
            )}
            {' '}ha sido registrada.
          </p>

          <div className="space-y-2 mb-6">
            {items.map(item => (
              <div key={item.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
                <div className="text-xs text-gray-500">{item.category}</div>
                <div className="font-semibold text-[#1a2332]">{item.name}{item.quantity > 1 && <span className="text-gray-500 font-normal"> × {item.quantity}</span>}</div>
                <div className="text-lg font-bold text-orange-600 mt-1">{formatQ(item.price)}</div>
              </div>
            ))}
            <div className="bg-[#1a2332] text-white rounded-lg p-4 flex justify-between items-center">
              <span>Total a pagar</span>
              <span className="text-xl font-bold text-orange-400">{formatQ(totalAmount)}</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <strong>Paso 1:</strong> Realiza la transferencia por <strong>{formatQ(totalAmount)}</strong>
              </div>
            </div>
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <strong>Paso 2:</strong> Envía comprobante a <strong>salazaroliveros@gmail.com</strong> o por WhatsApp al <strong>+502 4060 1526</strong>. Incluye tu número de orden.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <strong>Paso 3:</strong> Recibirás acceso en máximas 24 horas hábiles
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mb-4">
            <h3 className="font-semibold text-[#1a2332] mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-orange-500" /> Sube tu comprobante de pago
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Sube el comprobante de la transferencia para acelerar la verificacion.
            </p>
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-1">
                {orderIds.length > 1 ? `Se generaron ${orderIds.length} órdenes. Puedes subir el comprobante para cada una:` : 'Sube tu comprobante:'}
              </p>
              {orderIds.map((oid, idx) => (
                <div key={oid} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-mono mb-2">Orden #{oid.slice(0, 8)}</div>
                  <FileUploader
                    onUpload={async (file) => {
                      const result = await receiptService.uploadReceipt(oid, customer.email, file);
                      return result;
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/portal"
            className="inline-block w-full bg-[#1a2332] hover:bg-[#243042] text-white py-3 rounded-lg font-semibold"
          >
            Ir a mi Portal
          </Link>
          <Link
            to="/"
            className="inline-block w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold mt-2"
          >
            Volver al sitio
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  const customer = items[0].customer;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1a2332] text-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-5 h-5 text-orange-400" />
            <span className="font-semibold">ConstructoraGT</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-white/60">
            <Lock className="w-3.5 h-3.5" /> Pago seguro
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1a2332] mb-2 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-orange-500" /> Finalizar compra
        </h1>
        <p className="text-gray-600 mb-8">
          Completa tu compra mediante transferencia bancaria directa.
        </p>

        <div className="grid lg:grid-cols-5 gap-6">
          <aside className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-6">
              <h2 className="font-bold text-[#1a2332] mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-500" />
                Resumen del pedido ({items.length} {items.length === 1 ? 'producto' : 'productos'})
              </h2>

              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.id} className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-xs text-orange-700 font-semibold">{item.category}</div>
                        <div className="font-bold text-[#1a2332]">{item.name}</div>
                        {item.quantity > 1 && <div className="text-xs text-gray-500">Cantidad: {item.quantity}</div>}
                      </div>
                      <div className="text-xl font-bold text-orange-600">{formatQ(item.price)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatQ(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#1a2332] pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatQ(totalAmount)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-2 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Pago directo sin intermediarios</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Entrega digital en menos de 24 horas</span>
                </div>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
              <h2 className="font-bold text-[#1a2332] mb-1 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-500" /> Transferencia Bancaria
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Realiza una transferencia por <strong>{formatQ(totalAmount)}</strong> a nuestra cuenta.
              </p>

              {!bankingInfo ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
                  <AlertCircle className="w-5 h-5 inline mr-2" />
                  Los datos bancarios aún no han sido configurados. Contáctanos a <strong>salazaroliveros@gmail.com</strong> o al WhatsApp <strong>+502 4060 1526</strong>.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <span className="font-bold text-blue-900">{bankingInfo.bank_name}</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Nombre de cuenta</div>
                        <div className="font-semibold text-[#1a2332]">{bankingInfo.account_name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Número de cuenta</div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-[#1a2332]">{bankingInfo.account_number}</span>
                          <button
                            onClick={copyAccountNumber}
                            className="p-1 hover:bg-blue-100 rounded transition"
                            title="Copiar número"
                          >
                            <Copy className={`w-4 h-4 ${copied === 'account_number' ? 'text-green-600' : 'text-gray-600'}`} />
                          </button>
                        </div>
                      </div>
                      {bankingInfo.account_type && (
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Tipo de cuenta</div>
                          <div className="font-semibold text-[#1a2332] capitalize">{bankingInfo.account_type}</div>
                        </div>
                      )}
                      {bankingInfo.nit && (
                        <div>
                          <div className="text-xs text-gray-600 mb-1">NIT</div>
                          <div className="font-mono text-sm text-[#1a2332]">{bankingInfo.nit}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {bankingInfo.instructions && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-xs text-gray-600 mb-2">Instrucciones</div>
                      <div className="text-sm text-[#1a2332]">{bankingInfo.instructions}</div>
                    </div>
                  )}

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-xs text-green-700 mb-2">Importe a transferir</div>
                    <div className="text-2xl font-bold text-green-900">{formatQ(totalAmount)}</div>
                  </div>

                  <button
                    onClick={confirmPayment}
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-orange-500/30"
                  >
                    {loading ? (
                      'Procesando...'
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        {items.length > 1 ? `Confirmar ${items.length} Órdenes` : 'Confirmar Orden'}
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Tu pago será verificado en 24 horas hábiles
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
