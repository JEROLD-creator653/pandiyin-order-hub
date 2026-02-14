import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, ShoppingCart, Minus, Plus, ArrowLeft, Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useProductReviews } from '@/hooks/useProductReviews';
import { toast } from '@/hooks/use-toast';
import RatingStars from '@/components/RatingStars';
import ReviewSummary, { ReviewStats } from '@/components/ReviewSummary';
import ReviewList from '@/components/ReviewList';
import ReviewForm, { ReviewFormData } from '@/components/ReviewForm';
import ConfirmDialog from '@/components/ConfirmDialog';
import RelatedProducts from '@/components/RelatedProducts';
import ProductDescriptionCollapsible from '@/components/ProductDescriptionCollapsible';
import TaxInclusiveInfo from '@/components/TaxInclusiveInfo';
import { formatPrice } from '@/lib/formatters';
import { Loader } from '@/components/ui/loader';
import { getPricingInfo } from '@/lib/discountCalculations';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, items: cartItems } = useCart();
  const [adding, setAdding] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'rating_high' | 'rating_low'>('recent');
  
  const {
    reviews,
    stats,
    loading: reviewsLoading,
    hasMore,
    loadMore,
    submitReview,
    deleteReview,
    getUserReview
  } = useProductReviews({
    productId: id || '',
    userId: user?.id,
    sortBy,
    filterByRating: selectedRating
  });

  useEffect(() => {
    if (!id) return;
    supabase
      .from('products')
      .select('*, categories(name)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        setProduct(data);
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = () => {
    if (!user) { navigate('/auth'); return; }
    // optimistic UI: mark as adding so button becomes "Go to Cart" instantly
    setAdding(true);
    try {
      addToCart(product.id, qty);
    } finally {
      setTimeout(() => setAdding(false), 400);
    }
  };

  const handleWriteReview = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Check if user already has a review
    const existingReview = await getUserReview();
    if (existingReview) {
      setEditingReview(existingReview);
    }
    setShowReviewForm(true);
  };

  const handleSubmitReview = async (reviewData: ReviewFormData) => {
    await submitReview({
      ...reviewData,
      reviewId: editingReview?.id
    });
    setShowReviewForm(false);
    setEditingReview(null);
  };

  const handleEditReview = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (review) {
      setEditingReview(review);
      setShowReviewForm(true);
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    setDeleteReviewId(reviewId);
  };

  const confirmDeleteReview = async () => {
    if (deleteReviewId) {
      await deleteReview(deleteReviewId);
      setDeleteReviewId(null);
    }
  };

  if (loading) return (
    <Loader text="Loading product details..." className="min-h-[60vh]" delay={200} />
  );

  if (!product) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <p className="text-muted-foreground">Product not found.</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate('/products')}>Back to Products</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-8">
      {/* Back Button */}
      <div className="container mx-auto px-4 mb-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      {/* Main Content Grid: Product Image + Details */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          {/* Left Column: Product Image Card (Desktop 2/5, Mobile Full Width) */}
          <div className="lg:col-span-2">
            <div className="sticky top-28 rounded-2xl overflow-hidden border border-muted shadow-sm bg-muted h-[520px] w-full">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-full object-cover block" 
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <Leaf className="h-24 w-24 text-muted-foreground/40" />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Details (Desktop 3/5, Mobile Full Width) */}
          <div className="lg:col-span-3 flex flex-col">
            {/* Product Header */}
            {product.categories?.name && (
              <Badge variant="secondary" className="mb-3 w-fit">{product.categories.name}</Badge>
            )}
            <h1 className="text-3xl lg:text-4xl font-display font-bold mb-4">{product.name}</h1>
            
            {/* Rating Summary */}
            {stats && stats.total_reviews > 0 && stats.average_rating > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <RatingStars rating={stats.average_rating} showNumber size="md" />
                <span className="text-sm text-muted-foreground">
                  ({stats.total_reviews} {stats.total_reviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}

            {/* Price Section */}
            {(() => {
              const pricing = getPricingInfo(product.price, product.compare_price);
              return (
                <div className="mb-6">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-4xl font-bold text-primary">{formatPrice(product.price)}</span>
                    {pricing.hasDiscount && (
                      <>
                        <span className="text-lg text-muted-foreground line-through">{formatPrice(pricing.comparePrice)}</span>
                        <Badge className="bg-green-100 hover:bg-green-100 text-green-800 text-sm font-bold border-0 px-2.5 py-1">
                          {pricing.discountPercent}% OFF
                        </Badge>
                      </>
                    )}
                  </div>
                  {pricing.hasDiscount && (
                    <p className="text-sm text-green-700 font-medium">You save {formatPrice(pricing.savingsAmount)} on this product</p>
                  )}
                  <div className="mt-3 pb-4 border-b" />
                </div>
              );
            })()}

            {/* Tax Inclusive Badge */}
            <div className="mb-6">
              <TaxInclusiveInfo variant="subtitle" />
            </div>

            {/* Weight/Unit Info */}
            {product.weight && (
              <p className="text-sm text-muted-foreground mb-6">{product.weight} {product.unit}</p>
            )}

            {/* Product Description - With Smooth Read More */}
            <div className="mb-8 flex-grow">
              <ProductDescriptionCollapsible
                key={product.id}
                content={product.description}
                imageHeight={400}
              />
            </div>

            {/* Quantity & Add to Cart Section */}
            <div className="space-y-4">
              {product.stock_quantity > 0 ? (
                <>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-muted-foreground">Quantity:</span>
                    <div className="flex items-center border rounded-lg bg-muted/50">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="h-9 w-9"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-semibold">{qty}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))}
                        className="h-9 w-9"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">{product.stock_quantity} available</span>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    {((cartItems || []).some(i => i.product_id === product.id) || adding) ? (
                      <Button
                        size="lg"
                        variant="outline"
                        className="flex-1 rounded-full h-12 font-semibold bg-primary text-primary-foreground group-hover:!bg-transparent group-hover:!text-foreground transition-colors"
                        onClick={() => navigate('/cart')}
                      >
                        <motion.span initial={{ x: -6, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center justify-center">
                          <ShoppingCart className="mr-2 h-5 w-5" /> Go to Cart
                        </motion.span>
                      </Button>
                    ) : (
                      <Button 
                        size="lg" 
                        className="flex-1 rounded-full h-12 font-semibold" 
                        onClick={handleAddToCart}
                      >
                        <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                      </Button>
                    )}
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="flex-1 rounded-full h-12 font-semibold"
                      onClick={() => {
                        handleAddToCart();
                        navigate('/cart');
                      }}
                    >
                      Buy Now
                    </Button>
                  </div>
                </>
              ) : (
                <Badge variant="destructive" className="text-base px-4 py-2 w-fit">Out of Stock</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="border-t pt-12">
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="reviews" className="gap-2">
                <Star className="h-4 w-4" />
                Ratings & Reviews
                {stats && stats.total_reviews > 0 && (
                  <Badge variant="secondary" className="ml-2">{stats.total_reviews}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reviews" className="space-y-8">
              {/* Write Review Button */}
              {!showReviewForm && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-2xl font-bold">Customer Reviews</h2>
                  <Button onClick={handleWriteReview} className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Write a Review
                  </Button>
                </div>
              )}

              {/* Review Form */}
              {showReviewForm && (
                <ReviewForm
                  productId={product.id}
                  productName={product.name}
                  existingReview={editingReview}
                  onSubmit={handleSubmitReview}
                  onCancel={() => {
                    setShowReviewForm(false);
                    setEditingReview(null);
                  }}
                />
              )}

              {/* Review Summary */}
              <ReviewSummary
                stats={stats as ReviewStats | null}
                selectedRating={selectedRating}
                onFilterByRating={setSelectedRating}
              />

              {/* Review List */}
              <ReviewList
                reviews={reviews}
                loading={reviewsLoading}
                currentUserId={user?.id}
                selectedRating={selectedRating}
                sortBy={sortBy}
                onSortChange={(sort) => setSortBy(sort)}
                onEdit={handleEditReview}
                onDelete={handleDeleteReview}
                onLoadMore={loadMore}
                hasMore={hasMore}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Related Products Section - Full Width */}
      <div className="mt-20">
        <Separator className="mb-8" />
        <div className="container mx-auto px-4">
          <RelatedProducts 
            currentProductId={product.id}
            categoryId={product.category_id}
            maxItems={4}
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteReviewId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteReviewId(null);
        }}
        title="Delete Review"
        description="Are you sure you want to delete this review? This action cannot be undone."
        onConfirm={confirmDeleteReview}
      />
    </div>
  );
}
