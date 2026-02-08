# Product Review & Rating System

A comprehensive review and rating system for PANDIYIN Order Hub, inspired by professional e-commerce platforms like Amazon and Flipkart.

## 📋 Features

### ⭐ Rating System
- **5-Star Rating Display** - Visual star ratings with half-star support
- **Interactive Star Input** - User-friendly rating selection interface
- **Average Rating Calculation** - Automatically calculated and displayed on products
- **Rating Distribution** - Visual breakdown of ratings (5-star to 1-star)

### 📝 Review Features
- **Write Reviews** - Customers can write detailed product reviews
- **Review Title & Description** - Structured review format
- **Character Validation** - Minimum/maximum length requirements
- **Edit & Delete** - Users can manage their own reviews
- **Verified Purchase Badge** - Displayed for customers who bought the product
- **Image Upload** - Support for up to 5 review images (ready for integration)
- **User Attribution** - Reviews show user name/email with avatar

### 👍 Helpful Votes
- **Like/Dislike Reviews** - Users can mark reviews as helpful or not
- **Vote Count Display** - Shows total helpful votes
- **Prevent Self-Voting** - Users cannot vote on their own reviews
- **Toggle Votes** - Users can change or remove their votes

### 🔍 Filtering & Sorting
- **Filter by Rating** - View only reviews with specific star ratings
- **Sort Options**:
  - Most Recent
  - Most Helpful
  - Highest Rating
  - Lowest Rating
- **Pagination** - Load more reviews with infinite scroll support

### 🎨 UI Components

#### Components Created:
- **RatingStars.tsx** - Display star ratings (read-only)
- **RatingInput.tsx** - Interactive star rating input
- **ReviewSummary.tsx** - Overall rating statistics and distribution
- **ReviewCard.tsx** - Individual review display
- **ReviewForm.tsx** - Form for submitting/editing reviews
- **ReviewList.tsx** - List of reviews with filters
- **ConfirmDialog.tsx** - Confirmation dialog for destructive actions

#### Custom Hook:
- **useProductReviews.tsx** - Complete review management logic

## 🗄️ Database Schema

### Tables Created:

#### 1. `product_reviews`
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → auth.users)
- product_id (UUID, Foreign Key → products)
- order_id (UUID, Foreign Key → orders, nullable)
- rating (INTEGER, 1-5)
- title (TEXT)
- review_text (TEXT)
- helpful_count (INTEGER)
- verified_purchase (BOOLEAN)
- images (TEXT[])
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

**Constraints:**
- One review per user per product (UNIQUE constraint)
- Rating must be between 1 and 5

#### 2. `review_votes`
```sql
- id (UUID, Primary Key)
- review_id (UUID, Foreign Key → product_reviews)
- user_id (UUID, Foreign Key → auth.users)
- is_helpful (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

**Constraints:**
- One vote per user per review (UNIQUE constraint)

#### 3. `product_review_stats` (View)
Aggregated statistics view for each product:
- total_reviews
- average_rating
- five_star, four_star, three_star, two_star, one_star
- verified_purchases

### Added to `products` Table:
- `average_rating` (NUMERIC, updated automatically)
- `review_count` (INTEGER, updated automatically)

## 🔒 Security (Row Level Security)

### product_reviews Policies:
- ✅ Anyone can view reviews
- ✅ Authenticated users can create reviews
- ✅ Users can update/delete their own reviews
- ✅ Admins can manage all reviews

### review_votes Policies:
- ✅ Anyone can view votes
- ✅ Authenticated users can vote
- ✅ Users can update/delete their own votes

## ⚙️ Automatic Triggers

### 1. Helpful Count Update
Automatically updates `helpful_count` when votes are added/removed/changed.

### 2. Verified Purchase Flag
Automatically sets `verified_purchase = true` if user has a delivered order for the product.

### 3. Product Rating Stats
Automatically updates product's `average_rating` and `review_count` when reviews change.

### 4. Updated At Timestamp
Automatically updates `updated_at` timestamp on review edits.

## 🚀 Installation & Setup

### Step 1: Apply Database Migration

You need to run the migration file to create the necessary database tables. Choose one of these methods:

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `supabase/migrations/20260208_add_reviews_system.sql`
4. Copy and paste the entire content
5. Click **Run** to execute the migration

#### Option B: Using Supabase CLI (if installed)
```bash
supabase db push
```

or 

```bash
npx supabase db push
```

#### Option C: Manual SQL Execution
Connect to your database and run the SQL file content directly.

### Step 2: Refresh TypeScript Types (Optional)

After running the migration, regenerate Supabase types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

Replace `YOUR_PROJECT_ID` with your actual Supabase project ID.

### Step 3: Verify Installation

1. Start your development server: `npm run dev`
2. Navigate to any product detail page
3. You should see the "Ratings & Reviews" section
4. Try writing a review (you must be logged in)

## 📖 Usage

### Display Reviews on Product Page

The review system is automatically integrated into the `ProductDetail` page. It includes:

1. **Rating Display** - Shows average rating and review count near product price
2. **Reviews Tab** - Contains:
   - Write Review button
   - Review Summary (rating distribution)
   - Review List with filters and sorting
   - Load More functionality

### Writing a Review

1. User must be logged in
2. Click "Write a Review" button
3. Select rating (1-5 stars)
4. Enter review title (5-100 characters)
5. Enter review text (20-2000 characters)
6. Optionally upload images (up to 5)
7. Click "Submit Review"

### Verified Purchase

Reviews from users who have purchased and received the product will automatically show a "Verified Purchase" badge.

## 🎨 Customization

### Styling
The components use Tailwind CSS and match your existing design system. You can customize:
- Star colors in `RatingStars.tsx` and `RatingInput.tsx`
- Card styling in `ReviewCard.tsx`
- Form layout in `ReviewForm.tsx`

### Validation Rules
Edit validation rules in `ReviewForm.tsx`:
```typescript
- Title: 5-100 characters
- Review: 20-2000 characters
- Images: Max 5 images
- Rating: Required (1-5 stars)
```

### Pagination
Adjust review pagination in `ProductDetail.tsx`:
```typescript
useProductReviews({
  productId: id || '',
  userId: user?.id,
  limit: 10, // Change this number
  sortBy,
  filterByRating: selectedRating
})
```

## 🔄 API Reference

### useProductReviews Hook

```typescript
const {
  reviews,          // Array of reviews
  stats,            // Review statistics
  loading,          // Loading state
  hasMore,          // More reviews available
  loadMore,         // Load more reviews
  submitReview,     // Submit/update review
  voteOnReview,     // Vote on review
  deleteReview,     // Delete review
  getUserReview,    // Get user's review
  refresh           // Refresh all data
} = useProductReviews({
  productId: string;
  userId?: string;
  limit?: number;
  sortBy?: 'recent' | 'helpful' | 'rating_high' | 'rating_low';
  filterByRating?: number | null;
});
```

## 🐛 Troubleshooting

### TypeScript Errors
If you see TypeScript errors about missing tables, ensure:
1. The migration has been applied successfully
2. You've regenerated the Supabase types
3. The type assertions (`as any`) are in place temporarily

### Reviews Not Showing
1. Check browser console for errors
2. Verify migration was applied successfully
3. Check RLS policies in Supabase dashboard
4. Ensure product ID exists in database

### Verified Purchase Not Working
1. Check if user has completed orders
2. Verify order status is 'delivered'
3. Check order_items table has the product_id

## 📱 Mobile Responsive

All components are fully responsive and work seamlessly on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## 🎯 Best Practices

1. **Performance**: Reviews are paginated to avoid loading all at once
2. **Security**: All mutations require authentication
3. **UX**: Clear feedback with toast notifications
4. **Validation**: Both client and server-side validation
5. **Accessibility**: ARIA labels and keyboard navigation support

## 🔮 Future Enhancements

Potential features to add:
- [ ] Image upload to Supabase Storage
- [ ] Review reporting/flagging
- [ ] Admin moderation panel
- [ ] Email notifications
- [ ] Review response from sellers
- [ ] Q&A section
- [ ] Review templates
- [ ] Media gallery for all review images
- [ ] Export reviews to CSV
- [ ] Sentiment analysis

## 📄 License

This code is part of PANDIYIN Order Hub project.

## 👥 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the database logs in Supabase
3. Check browser console for errors
4. Review the migration file for any failed queries

---

**Created:** February 8, 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
