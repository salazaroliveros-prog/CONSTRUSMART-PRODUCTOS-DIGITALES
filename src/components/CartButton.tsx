import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Badge } from '@/components/ui/badge';
import { formatQ } from '@/lib/constructionData';

const CartButton: React.FC = () => {
  const navigate = useNavigate();
  const { itemCount, cart } = useCart();

  return (
    <button
      onClick={() => navigate('/cart')}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition"
      aria-label="Ver carrito"
    >
      <ShoppingCart className="w-6 h-6 text-gray-700" />
      {itemCount > 0 && (
        <Badge className="absolute -top-1 -right-1 bg-orange-500 hover:bg-orange-600">
          {itemCount}
        </Badge>
      )}
    </button>
  );
};

export default CartButton;