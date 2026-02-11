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
import { formatPrice } from '@/lib/formatters';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
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
    addToCart(product.id, qty);
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
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <Skeleton className="aspect-square rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
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
      <div className="container mx-auto px-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      {/* Amazon-Style Layout: Sticky Image + Scrollable Content */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col lg:flex-row gap-0">
        {/* Sticky Image Sidebar - Left (Amazon Style) */}
        <div className="w-full lg:w-2/5 lg:sticky lg:top-24 lg:h-screen lg:overflow-y-auto lg:flex lg:items-start">
          <div className="w-full aspect-square lg:aspect-auto lg:h-full overflow-hidden flex items-center justify-center p-6 lg:p-8">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-3xl shadow-sm mx-auto max-w-[92%]" />
            ) : (
              <Leaf className="h-20 w-20 text-muted-foreground/30" />
            )}
          </div>
        </div>

        {/* Scrollable Content Section - Right */}
        <div className="w-full lg:w-3/5 lg:overflow-y-auto lg:h-screen">
          <div className="px-4 lg:px-8 py-8 max-w-3xl">
            {/* Product Header */}
            {product.categories?.name && (
              <Badge variant="secondary" className="mb-3">{product.categories.name}</Badge>
            )}
            <h1 className="text-3xl font-display font-bold mb-4">{product.name}</h1>
            
            {/* Rating Summary */}
            {stats && stats.total_reviews > 0 && stats.average_rating > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <RatingStars rating={stats.average_rating} showNumber size="md" />
                <span className="text-sm text-muted-foreground">
                  ({stats.total_reviews} {stats.total_reviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-medium text-primary">{formatPrice(product.price)}</span>
              {product.compare_price && (
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.compare_price)}</span>
              )}
            </div>
            {product.weight && <p className="text-sm text-muted-foreground mb-4">{product.weight} {product.unit}</p>}
            
            {/* Product Description - With Scrollable Read More */}
            <div className="mb-8">
              <ProductDescriptionCollapsible
                content={product.description}
                imageHeight={400}
              />
            </div>

            {/* Quantity & Add to Cart */}
            {product.stock_quantity > 0 ? (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center border rounded-lg">
                    <Button variant="ghost" size="icon" onClick={() => setQty(q => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></Button>
                    <span className="w-12 text-center font-medium">{qty}</span>
                    <Button variant="ghost" size="icon" onClick={() => setQty(q => Math.min(product.stock_quantity, q + 1))}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <span className="text-sm text-muted-foreground">{product.stock_quantity} in stock</span>
                </div>
                <div className="flex gap-3 mb-8">
                  <Button size="lg" className="flex-1 rounded-full" onClick={handleAddToCart}>
                    <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                  </Button>
                  <Button size="lg" variant="secondary" className="rounded-full" onClick={() => {
                    handleAddToCart();
                    navigate('/cart');
                  }}>
                    Buy Now
                  </Button>
                </div>
              </>
            ) : (
              <Badge variant="destructive" className="text-base px-4 py-2 mb-8">Out of Stock</Badge>
            )}

            {/* Reviews Section */}
            <div className="border-t pt-8">
              <Tabs defaultValue="reviews" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="reviews" className="gap-2">
                    <Star className="h-4 w-4" />
                    Ratings & Reviews
                    {stats && stats.total_reviews > 0 && (
                      <Badge variant="secondary" className="ml-1">{stats.total_reviews}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="reviews" className="space-y-8">
                  {/* Write Review Button */}
                  {!showReviewForm && (
                    <div className="flex justify-between items-center">
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
        </div>
      </motion.div>

      {/* Related Products Section - Full Width */}
      <div className="container mx-auto px-4 mt-16">
        <Separator className="mb-8" />
        <RelatedProducts 
          currentProductId={product.id}
          categoryId={product.category_id}
          maxItems={4}
        />
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
