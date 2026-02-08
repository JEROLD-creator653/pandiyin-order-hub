import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title: string;
  review_text: string;
  helpful_count: number;
  verified_purchase: boolean;
  images?: string[];
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  user_vote?: 'helpful' | 'not_helpful' | null;
}

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
  verified_purchases?: number;
}

interface UseProductReviewsOptions {
  productId: string;
  userId?: string;
  limit?: number;
  sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
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
        one_star: 0,
        verified_purchases: 0
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
          *,
          users:user_id (
            id,
            email,
            raw_user_meta_data
          )
        `, { count: 'exact' })
        .eq('product_id', productId)
        .range(pageNum * limit, (pageNum + 1) * limit - 1);

      // Apply rating filter
      if (filterByRating) {
        query = query.eq('rating', filterByRating);
      }

      // Apply sorting
      switch (sortBy) {
        case 'helpful':
          query = query.order('helpful_count', { ascending: false });
          break;
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
        toast({
          title: 'Error',
          description: 'Failed to load reviews',
          variant: 'destructive'
        });
        return;
      }

      // Fetch user votes if logged in
      let reviewsWithVotes = data || [];
      if (userId && reviewsWithVotes.length > 0) {
        const reviewIds = reviewsWithVotes.map((r: any) => r.id);
        const { data: votes } = await (supabase as any)
          .from('review_votes')
          .select('review_id, is_helpful')
          .eq('user_id', userId)
          .in('review_id', reviewIds);

        const votesMap = new Map(
          votes?.map((v: any) => [v.review_id, v.is_helpful ? 'helpful' : 'not_helpful']) || []
        );

        reviewsWithVotes = reviewsWithVotes.map((review: any) => ({
          ...review,
          user_name: review.users?.raw_user_meta_data?.full_name,
          user_email: review.users?.email,
          user_vote: votesMap.get(review.id) || null
        }));
      } else {
        reviewsWithVotes = reviewsWithVotes.map((review: any) => ({
          ...review,
          user_name: review.users?.raw_user_meta_data?.full_name,
          user_email: review.users?.email,
          user_vote: null
        }));
      }

      if (append) {
        setReviews(prev => [...prev, ...reviewsWithVotes]);
      } else {
        setReviews(reviewsWithVotes);
      }

      setHasMore((count || 0) > (pageNum + 1) * limit);
    } catch (error) {
      console.error('Error:', error);
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
    title: string;
    review_text: string;
    images?: string[];
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

    try {
      const payload = {
        user_id: userId,
        product_id: productId,
        rating: reviewData.rating,
        title: reviewData.title,
        review_text: reviewData.review_text,
        images: reviewData.images || []
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

  // Vote on review
  const voteOnReview = useCallback(async (reviewId: string, isHelpful: boolean) => {
    if (!userId) {
      toast({
        title: 'Login Required',
        description: 'Please log in to vote on reviews',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Check if user already voted
      const { data: existingVote } = await (supabase as any)
        .from('review_votes')
        .select('*')
        .eq('review_id', reviewId)
        .eq('user_id', userId)
        .single();

      if (existingVote) {
        // Update existing vote
        if ((existingVote as any).is_helpful === isHelpful) {
          // Remove vote if clicking the same button
          await (supabase as any)
            .from('review_votes')
            .delete()
            .eq('id', existingVote.id);
        } else {
          // Update to opposite vote
          await (supabase as any)
            .from('review_votes')
            .update({ is_helpful: isHelpful })
            .eq('id', existingVote.id);
        }
      } else {
        // Insert new vote
        await (supabase as any)
          .from('review_votes')
          .insert({
            review_id: reviewId,
            user_id: userId,
            is_helpful: isHelpful
          });
      }

      // Refresh reviews to get updated vote counts
      await fetchReviews(0, false);
      setPage(0);
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit vote',
        variant: 'destructive'
      });
    }
  }, [userId, fetchReviews]);

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
    voteOnReview,
    deleteReview,
    getUserReview,
    refresh: () => {
      fetchStats();
      fetchReviews(0, false);
      setPage(0);
    }
  };
}
