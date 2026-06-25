import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  trend?: { value: number; positive: boolean };
  subtitle?: string;
}

const COLOR_MAP: Record<string, string> = {
  orange: 'bg-orange-100 text-orange-600',
  green: 'bg-green-100 text-green-600',
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  red: 'bg-red-100 text-red-600',
};

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, color, trend, subtitle }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow duration-200">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-lg ${COLOR_MAP[color] || COLOR_MAP.orange} flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
          {trend.positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {Math.abs(trend.value)}%
        </div>
      )}
    </div>
    <div className="text-2xl font-bold text-[#1a2332] truncate">{value}</div>
    <div className="text-sm text-gray-500">{label}</div>
    {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
  </div>
);

export default StatCard;