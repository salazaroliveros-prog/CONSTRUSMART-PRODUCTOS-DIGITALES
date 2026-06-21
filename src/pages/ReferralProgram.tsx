import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Share2, Copy, Gift, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  referrals: {
    name: string;
    email: string;
    date: string;
    status: 'completed' | 'pending';
    earnings: number;
  }[];
}

const ReferralProgram: React.FC = () => {
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Generar código de referido único para el usuario
    const savedCode = localStorage.getItem('referral_code');
    if (savedCode) {
      setReferralCode(savedCode);
    } else {
      const code = `REF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setReferralCode(code);
      localStorage.setItem('referral_code', code);
    }

    // Cargar estadísticas (simulado)
    const mockStats: ReferralStats = {
      referralCode: referralCode || 'REFDEMO',
      totalReferrals: 5,
      totalEarnings: 750,
      pendingEarnings: 150,
      referrals: [
        { name: 'Juan Pérez', email: 'juan@email.com', date: '2024-01-15', status: 'completed', earnings: 150 },
        { name: 'María García', email: 'maria@email.com', date: '2024-01-18', status: 'completed', earnings: 150 },
        { name: 'Carlos López', email: 'carlos@email.com', date: '2024-01-20', status: 'pending', earnings: 0 },
      ],
    };
    setStats(mockStats);
  }, [referralCode]);

  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Enlace copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    const link = `${window.location.origin}?ref=${referralCode}`;
    const text = 'Únete a ConstructoraGT y obtén herramientas digitales para construcción';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ConstructoraGT - Referidos',
          text,
          url: link,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback para desktop
      copyReferralLink();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Gift className="w-4 h-4" />
            Programa de Referidos
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Gana Recompensas <span className="text-purple-600">Recomendando</span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Comparte ConstructoraGT con tus amigos y gana Q150 por cada referral que realice una compra.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">{stats.totalReferrals}</div>
              <div className="text-sm text-gray-600">Total Referidos</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">Q{stats.totalEarnings}</div>
              <div className="text-sm text-gray-600">Ganancias Totales</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <Gift className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-900">Q{stats.pendingEarnings}</div>
              <div className="text-sm text-gray-600">Pendientes</div>
            </div>
          </div>
        )}

        {/* Referral Link Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Tu Enlace de Referido
          </h3>
          <div className="flex gap-3">
            <div className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm">
              {window.location.origin}?ref={referralCode}
            </div>
            <button
              onClick={copyReferralLink}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg text-sm font-semibold"
            >
              {copied ? '¡Copiado!' : <><Copy className="w-4 h-4" /> Copiar</>}
            </button>
            <button
              onClick={shareLink}
              className="flex items-center gap-2 bg-[#1a2332] hover:bg-[#243042] text-white px-4 py-3 rounded-lg text-sm font-semibold"
            >
              <Share2 className="w-4 h-4" /> Compartir
            </button>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">¿Cómo Funciona?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">1</div>
              <h4 className="font-semibold text-gray-900 mb-2">Comparte tu Enlace</h4>
              <p className="text-sm text-gray-600">Envía tu enlace único a amigos, familia o colegas.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">2</div>
              <h4 className="font-semibold text-gray-900 mb-2">Ellos Compran</h4>
              <p className="text-sm text-gray-600">Cuando alguien use tu enlace y compre un producto.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">3</div>
              <h4 className="font-semibold text-gray-900 mb-2">Gana Dinero</h4>
              <p className="text-sm text-gray-600">Recibes Q150 por cada compra completada.</p>
            </div>
          </div>
        </div>

        {/* Referrals List */}
        {stats && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Tus Referidos</h3>
            {stats.referrals.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                Aún no tienes referidos. ¡Comparte tu enlace para comenzar!
              </p>
            ) : (
              <div className="space-y-3">
                {stats.referrals.map((ref, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <div className="font-semibold text-gray-900">{ref.name}</div>
                      <div className="text-sm text-gray-500">{ref.email}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${ref.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {ref.status === 'completed' ? 'Completado' : 'Pendiente'}
                      </div>
                      <div className="text-xs text-gray-500">{ref.date}</div>
                      {ref.earnings > 0 && (
                        <div className="text-sm font-bold text-green-600">+Q{ref.earnings}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            to="/portal"
            className="inline-flex items-center gap-2 bg-[#1a2332] hover:bg-[#243042] text-white px-6 py-3 rounded-lg font-semibold"
          >
            Volver a mi Portal
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReferralProgram;