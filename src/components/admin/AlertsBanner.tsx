import React from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AlertsBannerProps {
  pendingReceipts: number;
  pendingOrders: number;
  onTabChange: (tab: string) => void;
}

const AlertsBanner: React.FC<AlertsBannerProps> = ({ pendingReceipts, pendingOrders, onTabChange }) => {
  if (pendingReceipts === 0 && pendingOrders === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {pendingReceipts > 0 && (
        <button
          onClick={() => onTabChange('receipts')}
          className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3 hover:bg-red-100 transition group"
        >
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-left">
            <div className="text-lg font-bold text-red-700">{pendingReceipts}</div>
            <div className="text-xs text-red-600">Comprobantes pendientes de aprobar</div>
          </div>
        </button>
      )}
      {pendingOrders > 0 && (
        <button
          onClick={() => onTabChange('orders')}
          className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 hover:bg-yellow-100 transition group"
        >
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center group-hover:scale-110 transition">
            <FileText className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-left">
            <div className="text-lg font-bold text-yellow-700">{pendingOrders}</div>
            <div className="text-xs text-yellow-600">Órdenes pendientes</div>
          </div>
        </button>
      )}
    </div>
  );
};

export default AlertsBanner;