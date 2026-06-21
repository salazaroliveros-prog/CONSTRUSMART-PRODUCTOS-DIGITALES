import React from 'react';

const shimmer = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]';

export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
    <div className={`h-44 ${shimmer}`} />
    <div className="p-5 space-y-3">
      <div className={`h-5 w-3/4 rounded ${shimmer}`} />
      <div className={`h-4 w-full rounded ${shimmer}`} />
      <div className={`h-4 w-1/2 rounded ${shimmer}`} />
      <div className="flex justify-between items-end pt-3">
        <div className={`h-8 w-24 rounded ${shimmer}`} />
        <div className={`h-10 w-24 rounded-lg ${shimmer}`} />
      </div>
    </div>
  </div>
);

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100">
      <div className={`h-6 w-48 rounded ${shimmer}`} />
    </div>
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className={`h-5 flex-1 rounded ${shimmer}`} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const StatsGridSkeleton: React.FC = () => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
        <div className={`w-10 h-10 rounded-lg mb-3 ${shimmer}`} />
        <div className={`h-7 w-20 rounded mb-1 ${shimmer}`} />
        <div className={`h-4 w-16 rounded ${shimmer}`} />
      </div>
    ))}
  </div>
);

export const OrderListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg ${shimmer}`} />
          <div className="flex-1 space-y-2">
            <div className={`h-5 w-48 rounded ${shimmer}`} />
            <div className={`h-4 w-32 rounded ${shimmer}`} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const CalculatorResultSkeleton: React.FC = () => (
  <div className="bg-gradient-to-br from-[#1a2332] to-[#243042] text-white rounded-2xl shadow-xl p-6 md:p-8">
    <div className={`h-4 w-36 rounded mb-4 ${shimmer}`} />
    <div className={`h-8 w-48 rounded mb-4 ${shimmer}`} />
    <div className="bg-white/10 rounded-xl p-4 mb-4">
      <div className={`h-8 w-32 rounded ${shimmer}`} />
    </div>
    <div className="bg-orange-500/20 rounded-xl p-5 mb-4">
      <div className={`h-12 w-52 rounded mb-2 ${shimmer}`} />
      <div className={`h-4 w-40 rounded ${shimmer}`} />
    </div>
  </div>
);
