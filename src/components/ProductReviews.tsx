import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  verified: boolean;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, productName }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({
    customerName: '',
    rating: 5,
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const [hoveredRating, setHoveredRating] = useState(0);

  // Cargar reseñas (simulado)
  useEffect(() => {
    const savedReviews = localStorage.getItem(`reviews_${productId}`);
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    }
    setLoading(false);
  }, [productId]);

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating =>
    reviews.filter(r => r.rating === rating).length
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReview.customerName.trim() || !newReview.comment.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }

    setSubmitting(true);

    const review: Review = {
      id: Date.now().toString(),
      productId,
      customerName: newReview.customerName,
      rating: newReview.rating,
      comment: newReview.comment,
      createdAt: new Date().toISOString(),
      verified: true,
    };

    const updatedReviews = [review, ...reviews];
    setReviews(updatedReviews);
    localStorage.setItem(`reviews_${productId}`, JSON.stringify(updatedReviews));

    setNewReview({ customerName: '', rating: 5, comment: '' });
    setShowForm(false);
    setSubmitting(false);

    // En un sistema real, enviar a backend
    // await supabase.from('product_reviews').insert(review);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-[#1a2332] mb-4">Reseñas de Clientes</h3>
        
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="text-4xl font-bold text-[#1a2332]">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= Math.round(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-200 text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex w-16">
                {rating}{' '}
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 inline" />
              </div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400"
                  style={{
                    width: `${reviews.length > 0 ? (ratingDistribution[rating - 1] / reviews.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="w-8 text-sm text-gray-600 text-right">
                {ratingDistribution[rating - 1]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full bg-[#1a2332] hover:bg-[#243042] text-white py-3 rounded-lg font-semibold"
      >
        {showForm ? 'Cancelar' : 'Escribir una Reseña'}
      </button>

      {/* Review Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="text-lg font-bold text-[#1a2332] mb-4">Escribe tu Reseña</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tu Nombre
              </label>
              <input
                type="text"
                value={newReview.customerName}
                onChange={(e) => setNewReview({ ...newReview, customerName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Tu nombre"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Calificación
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating })}
                    onMouseEnter={() => setHoveredRating(rating)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        rating <= (hoveredRating || newReview.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-300'
                      } transition`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tu Comentario
              </label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                rows={4}
                placeholder="Comparte tu experiencia con este producto..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Publicar Reseña'}
            </button>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Sé el primero en reseñar {productName}
          </p>
        ) : (
          reviews.slice(0, 5).map((review) => (
            <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold">
                      {review.customerName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-[#1a2332]">{review.customerName}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('es-GT')}
                    </div>
                  </div>
                </div>
                {review.verified && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    ✓ Verificado
                  </span>
                )}
              </div>
              
              <div className="flex mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-300'
                    }`}
                  />
                ))}
              </div>
              
              <p className="text-gray-700">{review.comment}</p>
            </div>
          ))
        )}
        
        {reviews.length > 5 && (
          <button className="text-orange-500 hover:text-orange-600 text-sm font-semibold">
            Ver todas las {reviews.length} reseñas
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;