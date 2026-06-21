import React, { useState } from 'react';
import { X, Check, Minus, BarChart3 } from 'lucide-react';
import { DIGITAL_PRODUCTS, DigitalProduct, formatQ } from '@/lib/constructionData';

interface ProductComparisonProps {
  onClose: () => void;
}

const ProductComparison: React.FC<ProductComparisonProps> = ({ onClose }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleProduct = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
    } else if (selected.length < 4) {
      setSelected([...selected, id]);
    }
  };

  const comparisonProducts = DIGITAL_PRODUCTS.filter(p => selected.includes(p.id));
  const allFeatures = [...new Set(DIGITAL_PRODUCTS.flatMap(p => p.features))];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-6 h-6 text-orange-500" />
          <h3 className="text-2xl font-bold text-[#1a2332]">Comparar Productos</h3>
          <span className="text-sm text-gray-500 ml-2">(Selecciona hasta 4)</span>
        </div>

        {/* Product selector chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {DIGITAL_PRODUCTS.map(p => {
            const isSelected = selected.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleProduct(p.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                  isSelected
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {comparisonProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Selecciona productos para comparar sus características.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 bg-gray-50 border border-gray-200 w-40">Característica</th>
                  {comparisonProducts.map(p => (
                    <th key={p.id} className="p-3 bg-gray-50 border border-gray-200 text-center min-w-[180px]">
                      <div className="font-bold text-[#1a2332]">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.category}</div>
                      <div className="text-lg font-bold text-orange-600 mt-1">{p.priceLabel}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-gray-200 font-semibold text-gray-700">Descripción</td>
                  {comparisonProducts.map(p => (
                    <td key={p.id} className="p-3 border border-gray-200 text-gray-600 text-center text-xs">
                      {p.description}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 border border-gray-200 font-semibold text-gray-700">Precio</td>
                  {comparisonProducts.map(p => (
                    <td key={p.id} className="p-3 border border-gray-200 text-center font-bold text-orange-600">
                      {p.priceLabel}
                    </td>
                  ))}
                </tr>
                {allFeatures.map(feature => (
                  <tr key={feature}>
                    <td className="p-3 border border-gray-200 text-gray-700 text-xs">{feature}</td>
                    {comparisonProducts.map(p => (
                      <td key={p.id} className="p-3 border border-gray-200 text-center">
                        {p.features.includes(feature) ? (
                          <Check className="w-4 h-4 text-green-600 mx-auto" />
                        ) : (
                          <Minus className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {comparisonProducts.some(p => p.badge) && (
                  <tr>
                    <td className="p-3 border border-gray-200 font-semibold text-gray-700">Etiqueta</td>
                    {comparisonProducts.map(p => (
                      <td key={p.id} className="p-3 border border-gray-200 text-center">
                        {p.badge && (
                          <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {p.badge}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductComparison;
