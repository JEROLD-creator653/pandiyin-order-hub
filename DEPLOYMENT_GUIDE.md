# Deployment & Testing Guide

Complete checklist for deploying and testing the image upload system.

---

## 📋 Pre-Deployment Checklist

### Database Setup
- [ ] Run migration in Supabase SQL editor
- [ ] Verify `image_path` column added to banners
- [ ] Verify `image_path` column added to products
- [ ] Verify `user_id` column added to banners
- [ ] Verify `user_id` column added to products
- [ ] Verify indexes created
- [ ] Backup database

### Supabase Configuration
- [ ] Confirm storage buckets exist
  - [ ] `banner-images` (public)
  - [ ] `product-images` (public)
- [ ] Verify RLS policies enabled
- [ ] Review storage policies
- [ ] Check authentication enabled
- [ ] Verify service role key available

### Code Integration
- [ ] All files created in src/
- [ ] `imageUpload.ts` in lib/
- [ ] `ImageUpload.tsx` in components/
- [ ] `DragDropZone.tsx` in components/
- [ ] `AdminBanners.tsx` updated
- [ ] `AdminProducts.tsx` updated
- [ ] No import errors
- [ ] TypeScript compiles

### Environment Variables
- [ ] `VITE_SUPABASE_URL` set
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` set
- [ ] Both in `.env.local`
- [ ] Not in version control

### Dependencies
- [ ] `sonner` installed (for toast)
- [ ] `framer-motion` installed
- [ ] `lucide-react` installed
- [ ] All imports resolve

---

## 🧪 Local Testing

### Test 1: File Validation

```typescript
// Test: Valid image upload
- File: JPG, PNG, WEBP
- Size: < 5MB
- Expected: Accepted ✅

// Test: Invalid format
- File: .txt, .pdf, .mp4
- Expected: Error message ❌
- Message: "Invalid file format..."

// Test: File too large
- File: > 5MB
- Expected: Error message ❌
- Message: "File size exceeds 5MB..."

// Test: Empty file
- File: 0 bytes
- Expected: Should be rejected or handled
```

### Test 2: Upload Flow

```typescript
// Test: File Picker
1. Click "Add Banner/Product"
2. Click "Upload" button
3. File dialog opens
4. Select image
5. Preview appears ✅

// Test: Drag & Drop
1. Click "Add Banner/Product"
2. Drag image to drop zone
3. Hover effect visible ✅
4. Drop image
5. Preview appears ✅

// Test: Preview Display
1. Upload image
2. Preview shows image ✅
3. File name displays ✅
4. File size displays ✅
5. Remove button works ✅
```

### Test 3: Upload to Storage

```typescript
// Test: Image saved to storage
1. Upload banner image
2. Go to Supabase Dashboard
3. Check Storage > banner-images
4. Verify file uploaded
5. Check file path: {userId}/{timestamp}.png ✅

// Test: URL is public
1. Get public URL from banner record
2. Open URL in new tab
3. Image displays ✅

// Test: Database record created
1. Upload banner
2. Go to Supabase Dashboard
3. Check banners table
4. Verify row created with:
   - image_url (public URL)
   - image_path (storage path)
   - user_id (creator)
   ✅
```

### Test 4: Display on Frontend

```typescript
// Test: Fetch and display
1. Create banner/product
2. Go to homepage
3. Banner carousel shows image ✅
4. Products grid shows images ✅

// Test: Image loads correctly
1. Images display without broken links ✅
2. Images have correct aspect ratio ✅
3. Images are responsive ✅
```

### Test 5: Update Image

```typescript
// Test: Update banner image
1. Go to Admin > Banners
2. Click Edit on existing banner
3. Select new image
4. Click "Update"
5. In Supabase Storage:
   - New file uploaded ✅
   - Old file deleted ✅
6. Database record updated with new URL ✅
7. Frontend shows updated image ✅
```

### Test 6: Delete Image

```typescript
// Test: Delete banner
1. Go to Admin > Banners
2. Click Delete button
3. Confirmation dialog appears
4. Click "Delete" to confirm
5. In Supabase:
   - Record deleted from banners table ✅
   - Image file deleted from storage ✅
   - No orphaned files ✅
6. Frontend updates immediately ✅

// Test: Delete product
1. Same as banner
2. Check products table
3. Check product-images storage
```

### Test 7: Error Handling

```typescript
// Test: Network error during upload
1. Disconnect internet
2. Try to upload
3. Error message shows ✅
4. Image file NOT stored ✅

// Test: Database error
1. Temporarily disable RLS
2. Upload succeeds but DB fails (test scenario)
3. Storage file deleted (rollback) ✅

// Test: Invalid file
1. Try JPG - works ✅
2. Try PNG - works ✅
3. Try WEBP - works ✅
4. Try GIF - fails with message ✅
5. Try ZIP - fails with message ✅
```

### Test 8: Responsive Design

```typescript
// Test: Mobile (375px)
- Upload component visible ✅
- Drag & drop works
- Preview responsive ✅
- Buttons clickable ✅

// Test: Tablet (768px)
- Layout optimized ✅
- All features accessible ✅

// Test: Desktop (1920px)
- Full featured UI ✅
- All controls visible ✅
```

### Test 9: Real-time Updates

```typescript
// Test: Multiple users
1. Open admin in 2 browser windows
2. Upload in window 1
3. Window 2 updates instantly ✅

// Test: Image cache
1. View product
2. View another product (same image)
3. Uses cached image (faster) ✅
```

### Test 10: Security

```typescript
// Test: RLS Policies
1. Logged out - can view banners ✅
2. Non-admin user - cannot edit ✅
3. Admin user - can upload ✅
4. Admin user - can delete ✅

// Test: Public URLs
1. Banner image is public ✅
2. Product image is public ✅
3. Storage path not exposed ✅
```

---

## 🚀 Staging Deployment

### Before Deploying to Staging

- [ ] All tests pass locally
- [ ] Code review completed
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Bundle size acceptable
- [ ] Performance acceptable

### Staging Deployment Steps

```bash
# 1. Build for staging
npm run build

# 2. Deploy to staging
# (Your deployment command)

# 3. Test in staging
# - Test all upload features
# - Test delete features
# - Check Supabase logs
# - Verify storage usage
```

### Staging Post-Deployment Tests

- [ ] Upload banner works
- [ ] Upload product works
- [ ] Images display on site
- [ ] Update image works
- [ ] Delete works with cleanup
- [ ] No errors in console
- [ ] No errors in Supabase logs
- [ ] Storage organized correctly
- [ ] Database records correct
- [ ] URLs publicly accessible

---

## 🎯 Production Deployment

### Final Pre-Production Checklist

- [ ] All staging tests pass
- [ ] Performance tested with large files
- [ ] Stress testing (many concurrent uploads)
- [ ] Backup of production database
- [ ] Disaster recovery plan
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Support documented

### Production Deployment

```bash
# 1. Final build
npm run build

# 2. Deploy to production
# (Your deployment command)

# 3. Monitor closely
# - Watch error logs
# - Monitor storage usage
# - Check upload success rate
```

### Post-Deployment Monitoring (24 hours)

- [ ] No errors in production logs
- [ ] Upload success rate > 99%
- [ ] Image display working correctly
- [ ] Storage quota acceptable
- [ ] Database performance normal
- [ ] No complaints from users

---

## 📊 Performance Testing

### Load Test: Single Image Upload

```
Network: 4G
File Size: 2MB
Expected Time: < 5 seconds
Actual Time: ___ seconds
Result: ✅ / ❌
```

### Load Test: Large File

```
File Size: 5MB (max)
Expected Time: < 10 seconds
Actual Time: ___ seconds
Result: ✅ / ❌
```

### Load Test: Concurrent Uploads

```
Concurrent: 10 simultaneous uploads
File Size: 1MB each
Expected: All succeed
Actual: ___ / 10 succeeded
Result: ✅ / ❌
```

### Load Test: Display

```
Products on page: 20
Images: 20 loading simultaneously
Expected: All loaded < 3 seconds
Actual Time: ___ seconds
Result: ✅ / ❌
```

---

## 🔍 Verification Checklist

### Supabase Dashboard Checks

**Storage:**
```
banner-images/
  ├── {user-id}/
  │   ├── 1707123456789_abc123.png ✅
  │   └── 1707123456790_def456.webp ✅
  └── {other-user}/
      └── ...

product-images/
  ├── {user-id}/
  │   └── ...
```

**Database:**
```
banners table:
  ├── image_url: public URL ✅
  ├── image_path: storage path ✅
  ├── user_id: creator ID ✅

products table:
  ├── image_url: public URL ✅
  ├── image_path: storage path ✅
  ├── user_id: creator ID ✅
```

**RLS Policies:**
```
✅ Public can view active banners
✅ Public can view available products
✅ Authenticated can upload (if admin)
✅ Authenticated can delete (if admin)
```

---

## 🎓 User Acceptance Testing (UAT)

### Admin Acceptance Test

- [ ] Can upload banner easily
- [ ] Drag & drop works
- [ ] Preview before upload
- [ ] Upload completes quickly
- [ ] Image displays on site
- [ ] Can update image
- [ ] Can delete image
- [ ] Gets confirmation messages
- [ ] Understands what happened

### Customer Acceptance Test

- [ ] Banner carousel works
- [ ] Images load quickly
- [ ] Images display correctly
- [ ] Can click on banners (if linked)
- [ ] Product images visible
- [ ] Product images high quality
- [ ] Responsive on mobile
- [ ] No broken images

---

## 🐛 Bug Report Template

If issues found, document:

```
ISSUE: [Title]
SEVERITY: Critical / High / Medium / Low

DESCRIPTION:
[What happened]

STEPS TO REPRODUCE:
1. 
2. 
3. 

EXPECTED RESULT:
[What should happen]

ACTUAL RESULT:
[What actually happened]

ENVIRONMENT:
- Browser: [Firefox/Chrome/Safari]
- OS: [Windows/Mac/Linux]
- Screen: [Mobile/Tablet/Desktop]

TYPE:
- [ ] Upload issue
- [ ] Display issue
- [ ] Delete issue
- [ ] Update issue
- [ ] Other

LOGS:
[Console errors, Supabase logs, etc.]
```

---

## 📈 Success Metrics

Track these metrics:

| Metric | Target | Actual |
|--------|--------|--------|
| Upload success rate | > 99% | ___ |
| Avg upload time | < 3s | ___ |
| Image display time | < 1s | ___ |
| Storage quota used | < 80% | ___ |
| Error rate | < 1% | ___ |
| User satisfaction | > 4/5 | ___ |

---

## 🔧 Rollback Plan

If critical issues occur:

1. **Stop accepting uploads** - disable upload button
2. **Page not cache** - clear CDN if used
3. **Revert code** - deploy previous version
4. **Verify** - test basic functionality
5. **Investigate** - check logs and errors
6. **Fix** - resolve root cause
7. **Test again** - full test suite
8. **Redeploy** - carefully monitor

---

## 📞 Post-Deployment Support

### Common Issues & Quick Fixes

| Issue | Fix | Time |
|-------|-----|------|
| Images not uploading | Check file format/size | 2min |
| Images not displaying | Check public URL | 5min |
| Delete fails | Check permissions | 5min |
| Slow uploads | Compress file | 1min |
| Storage quota full | Delete old images | 10min |

### Support Contacts

- **Supabase Support:** support@supabase.io
- **Your Team Lead:** [contact]
- **On-Call Dev:** [contact]
- **Database Admin:** [contact]

---

## ✅ Sign-Off Checklist

Before marking as complete:

- [ ] All tests passed
- [ ] All bugs resolved
- [ ] Documentation updated
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Monitoring active
- [ ] Team trained
- [ ] User feedback positive
- [ ] Ready for production

---

**System is ready for deployment! 🚀**
