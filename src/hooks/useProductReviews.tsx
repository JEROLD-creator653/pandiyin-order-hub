import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  description: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

interface UseProductReviewsOptions {
  productId: string;
  userId?: string;
  limit?: number;
  sortBy?: 'recent' | 'rating_high' | 'rating_low';
  filterByRating?: number | null;
}

export function useProductReviews({
  productId,
  userId,
  limit = 10,
  sortBy = 'recent',
  filterByRating
}: UseProductReviewsOptions) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  // Fetch review statistics
  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('product_review_stats')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching review stats:', error);
        return;
      }

      setStats(data || {
        total_reviews: 0,
        average_rating: 0,
        five_star: 0,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [productId]);

  // Fetch reviews
  const fetchReviews = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    try {
      setLoading(true);
      
      let query = (supabase as any)
        .from('product_reviews')
        .select(`
          id,
          user_id,
          product_id,
          rating,
          description,
          created_at
        `, { count: 'exact' })
        .eq('product_id', productId)
        .range(pageNum * limit, (pageNum + 1) * limit - 1);

      // Apply rating filter
      if (filterByRating) {
        query = query.eq('rating', filterByRating);
      }

      // Apply sorting
      switch (sortBy) {
        case 'rating_high':
          query = query.order('rating', { ascending: false });
          break;
        case 'rating_low':
          query = query.order('rating', { ascending: true });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching reviews:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        toast({
          title: 'Error',
          description: `Failed to load reviews: ${error.message || 'Unknown error'}`,
          variant: 'destructive'
        });
        setReviews([]);
        setLoading(false);
        return;
      }

      // Map reviews without user details (to avoid auth.users RLS issues)
      const reviewsWithUser = (data || []).map((review: any) => ({
        ...review,
        user_name: 'Verified Customer',
        user_email: ''
      }));

      if (append) {
        setReviews(prev => [...prev, ...reviewsWithUser]);
      } else {
        setReviews(reviewsWithUser);
      }

      setHasMore((count || 0) > (pageNum + 1) * limit);
    } catch (error: any) {
      console.error('Fetch reviews error:', error);
      toast({
        title: 'Error',
        description: `Failed to load reviews: ${error?.message || 'Unknown error'}`,
        variant: 'destructive'
      });
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productId, userId, limit, sortBy, filterByRating]);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchReviews(0, false);
    setPage(0);
  }, [fetchStats, fetchReviews]);

  // Load more reviews
  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, true);
  }, [page, fetchReviews]);

  // Submit or update review
  const submitReview = useCallback(async (reviewData: {
    rating: number;
    description: string;
    reviewId?: string;
  }) => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'You must be logged in to submit a review',
        variant: 'destructive'
      });
      return;
    }

    if (!reviewData.description.trim() || reviewData.description.trim().length < 20) {
      toast({
        title: 'Error',
        description: 'Review must be at least 20 characters',
        variant: 'destructive'
      });
      return;
    }

    try {
      const payload = {
        user_id: userId,
        product_id: productId,
        rating: reviewData.rating,
        description: reviewData.description.trim()
      };

      let error;

      if (reviewData.reviewId) {
        // Update existing review
        ({ error } = await (supabase as any)
          .from('product_reviews')
          .update(payload)
          .eq('id', reviewData.reviewId)
          .eq('user_id', userId));
      } else {
        // Insert new review
        ({ error } = await (supabase as any)
          .from('product_reviews')
          .insert(payload));
      }

      if (error) {
        console.error('Error submitting review:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to submit review',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Success',
        description: reviewData.reviewId ? 'Review updated successfully' : 'Review submitted successfully'
      });

      // Refresh reviews and stats
      await fetchStats();
      await fetchReviews(0, false);
      setPage(0);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  }, [userId, productId, fetchStats, fetchReviews]);

  // Delete review
  const deleteReview = useCallback(async (reviewId: string) => {
    if (!userId) return;

    try {
      const { error } = await (supabase as any)
        .from('product_reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting review:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete review',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Review deleted successfully'
      });

      // Refresh reviews and stats
      await fetchStats();
      await fetchReviews(0, false);
      setPage(0);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [userId, fetchStats, fetchReviews]);

  // Check if user has already reviewed
  const getUserReview = useCallback(async () => {
    if (!userId) return null;

    try {
      const { data, error } = await (supabase as any)
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user review:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }, [userId, productId]);

  return {
    reviews,
    stats,
    loading,
    hasMore,
    loadMore,
    submitReview,
    deleteReview,
    getUserReview,
    refresh: () => {
      fetchStats();
      fetchReviews(0, false);
      setPage(0);
    }
  };
}
