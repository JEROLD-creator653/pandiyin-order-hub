# 🚀 Deployment & Testing Checklist

## Pre-Deployment Testing

### 1. Local Build & Preview
```bash
# Clean install
npm install

# Build production bundle
npm run build

# Expected output:
# ✓ Check bundle size in dist/
# ✓ Verify no console errors during build
# ✓ CSS is minified
# ✓ JS is minified

# Preview production build locally
npm run preview

# Open browser and test all pages
```

### 2. Browser Compatibility Testing

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | Latest | ✓ Required | Primary target |
| Firefox | Latest | ✓ Required | Secondary target |
| Safari | Latest | ✓ Required | macOS/iOS |
| Edge | Latest | ✓ Required | Windows alternative |
| Chrome Mobile | Latest | ✓ Required | Mobile primary |
| Safari Mobile | Latest | ✓ Required | iOS mobile |

### 3. Feature Testing Checklist

#### Authentication & Session
- [ ] User can sign up with email
- [ ] User can sign in with email
- [ ] User can sign up with phone
- [ ] User can sign in with phone
- [ ] User session persists after page refresh
- [ ] Logout clears session properly
- [ ] Session token properly cleaned up from localStorage
- [ ] Multiple browser tabs keep same session
- [ ] Session expires on logout
- [ ] Protected routes redirect to login when not authenticated

#### Address Management
- [ ] Can add new address
- [ ] Can edit existing address
- [ ] Address update shows immediately in checkout
- [ ] Can set default address
- [ ] Can delete address
- [ ] Address list UI reflects changes instantly
- [ ] Country code selector works
- [ ] Pincode API auto-fills location
- [ ] Form validation working

#### Product Features
- [ ] Product list loads with pagination
- [ ] Product detail page loads correctly
- [ ] Description with "Read More" works smoothly
- [ ] Images lazy load (check DevTools Network)
- [ ] Product ratings display correctly
- [ ] Can write/edit/delete reviews
- [ ] Related products section appears
- [ ] Product recommendations show relevant items

#### Cart & Checkout
- [ ] Add to cart works
- [ ] Cart items persist
- [ ] Quantity update smooth
- [ ] Remove item works
- [ ] Cart reminder popup appears
- [ ] Checkout form validates
- [ ] Address selection syncs with summary
- [ ] Coupon code application works
- [ ] Order creation successful
- [ ] Order confirmation email sent

#### Performance
- [ ] Page transitions are smooth
- [ ] No layout shifts during load
- [ ] Skeleton loaders appear while loading
- [ ] Images load lazily (visible on Network tab)
- [ ] API responses cached (same request not repeated)
- [ ] Buttons have hover animations
- [ ] All animations are 60fps smooth
- [ ] No jank on low-end devices

#### Accessibility
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus visible for keyboard users
- [ ] Alt text on images
- [ ] Color contrast sufficient
- [ ] Reduced motion respected (Settings > Motion)
- [ ] Screen reader friendly

---

## Performance Testing

### Lighthouse Audit
```
Target Scores:
├─ Performance: > 80
├─ Accessibility: > 90
├─ Best Practices: > 85
└─ SEO: > 85
```

**How to run:**
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Click "Analyze page load"
4. Check all scores meet targets

### Web Vitals Metrics
```
Target Metrics:
├─ LCP (Largest Contentful Paint): < 2.5s
├─ FID (First Input Delay): < 100ms
├─ CLS (Cumulative Layout Shift): < 0.1
└─ FCP (First Contentful Paint): < 1.8s
```

**How to check:**
1. DevTools > Console
2. Check performance metrics logged on page load
3. Compare with targets above
4. Use Chrome User Experience Report (CrUX)

### Bundle Size Analysis
```bash
# Check bundle size after build
cd dist/
ls -lh *.js

# Expected:
├─ vendor.js: ~120KB
├─ main.js: ~15KB
├─ ui.js: ~80KB
├─ supabase.js: ~60KB
├─ animations.js: ~40KB
└─ query.js: ~35KB

# Total should be under 400KB (uncompressed)
```

### Network Performance
**DevTools > Network Tab:**
- [ ] Images load lazily (appear when scrolled into view)
- [ ] No unnecessary requests
- [ ] API call caching visible (same request shows cached response)
- [ ] No large uncompressed assets
- [ ] CSS and JS minified

### Mobile Performance
**DevTools > Performance Tab:**
```
1. Start recording (Ctrl+Shift+P or Cmd+Shift+P)
2. Scroll through a page
3. Stop recording
4. Check:
   ├─ FPS stays around 60
   ├─ No long tasks (>50ms)
   ├─ Minimal layout thrashing
   └─ Smooth scroll performance
```

---

## Cross-Device Testing

### Desktop
- [x] Windows 10+ Chrome
- [x] Windows 10+ Firefox
- [x] Windows 10+ Edge
- [x] macOS Safari
- [x] macOS Chrome
- [x] Linux Chrome (if applicable)

### Tablet
- [x] iPad (iOS)
- [x] Android tablet
- [x] Check responsive breakpoints

### Phone
- [x] iPhone (iOS 13+)
- [x] Android (Latest 3 versions)
- [x] Test with actual device orientation changes
- [x] Test touchscreen interactions
- [x] Test with mobile network conditions

### Network Conditions (DevTools)
- [x] 4G (good networking)
- [x] 3G (moderate networking)
- [x] Slow 3G (poor networking)
- [x] Offline mode (if service worker implemented)

---

## Security Testing

### Authentication
- [ ] Passwords not logged
- [ ] No sensitive data in localStorage except tokens
- [ ] HTTPS only (check in browser)
- [ ] CORS headers correct
- [ ] Session token rotation working

### Data Protection
- [ ] Form inputs properly sanitized
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] CSRF tokens present
- [ ] Rate limiting on API endpoints

### Testing Tools
```bash
# Check for console errors/warnings
Open DevTools > Console tab

# Check for mixed content
Open DevTools > Security tab

# Check CORS headers
Network tab > Select request > Headers
```

---

## UAT (User Acceptance Testing)

### Typical User Workflows

#### Customer Journey 1: Browse & Purchase
```
1. [ ] Customer opens website
2. [ ] Browses products
3. [ ] Filters/searches for product
4. [ ] Views product details
5. [ ] Reads reviews
6. [ ] Adds to cart
7. [ ] Proceeds to checkout
8. [ ] Enters delivery address
9. [ ] Applies coupon
10. [ ] Places order
11. [ ] Receives confirmation
12. [ ] Check order in dashboard
```

#### Customer Journey 2: Address Management
```
1. [ ] Go to profile
2. [ ] View saved addresses
3. [ ] Add new address
4. [ ] Set as default
5. [ ] Edit address
6. [ ] Go to checkout
7. [ ] Verify updated address shows
8. [ ] Complete order
```

#### Customer Journey 3: Review System
```
1. [ ] Purchase product
2. [ ] Go to order detail
3. [ ] Write review
4. [ ] Rate product
5. [ ] Submit review
6. [ ] View review on product page
7. [ ] Edit own review
8. [ ] Delete own review
```

---

## Admin Testing

### Product Management
- [ ] Add new product
- [ ] Edit product details
- [ ] Upload product image
- [ ] Set pricing
- [ ] Manage inventory
- [ ] Categorize product
- [ ] Delete product

### Order Management
- [ ] View all orders
- [ ] Update order status
- [ ] Generate invoice
- [ ] Manage refunds
- [ ] View customer details

### Banner Management
- [ ] Create banner
- [ ] Upload banner image
- [ ] Set position/order
- [ ] Activate/deactivate banner
- [ ] Delete banner

### Analytics
- [ ] View sales dashboard
- [ ] Check revenue reports
- [ ] View customer analytics
- [ ] Check top products

---

## Deployment Steps

### Server Preparation
1. [ ] Verify server has Node.js installed
2. [ ] Verify database is accessible
3. [ ] Verify environment variables set
4. [ ] Verify SSL certificate valid
5. [ ] Verify CDN configured (if applicable)
6. [ ] Verify backup system in place
7. [ ] Verify monitoring/alerting configured

### Deployment
```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Run migrations (if needed)
npm run migrate

# 4. Build production bundle
npm run build

# 5. Copy to production server
# (Method depends on hosting platform)

# 6. Restart application server
# sudo systemctl restart app-name

# 7. Verify deployment
# Visit website and test key features
```

### Post-Deployment Verification
1. [ ] Website loads without errors
2. [ ] All pages accessible
3. [ ] Lighthouse score acceptable
4. [ ] No broken links
5. [ ] API endpoints responding
6. [ ] Database connected properly
7. [ ] Email notifications working
8. [ ] Payment gateway functioning
9. [ ] Analytics tracking working
10. [ ] Monitoring alerts set up

### Rollback Plan
```
If critical issue found:
1. Keep previous build backed up
2. Revert to previous version
git revert HEAD
npm install && npm run build
3. Redeploy previous version
4. Investigate issue
5. Fix and re-test thoroughly
6. Deploy again
```

---

## Monitoring & Maintenance

### Daily
- [ ] Check error logs
- [ ] Monitor website uptime
- [ ] Check server performance
- [ ] Review customer feedback

### Weekly
- [ ] Analyze performance metrics
- [ ] Check security logs
- [ ] Review new bug reports
- [ ] Update dependencies (if patches available)

### Monthly
- [ ] Full backup verification
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Database optimization
- [ ] Update changelog

---

## Go-Live Checklist

Before pushing to production, ensure:

### Code Quality
- [ ] No console.errors or warnings
- [ ] Linting passes: `npm run lint`
- [ ] No hardcoded URLs (use env variables)
- [ ] All tests passing: `npm run test`
- [ ] No sensitive data in code

### Performance
- [ ] Lighthouse score > 80
- [ ] LCP < 2.5s
- [ ] Bundle size within limits
- [ ] Minification enabled
- [ ] Images optimized

### Security
- [ ] No security vulnerabilities
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Auth tokens secure
- [ ] Sensitive data encrypted

### Functionality
- [ ] All features tested
- [ ] Edge cases handled
- [ ] Error states handled
- [ ] Loading states present
- [ ] Mobile responsive

### Documentation
- [ ] README updated
- [ ] API documentation complete
- [ ] Deployment guide written
- [ ] Environment variables documented
- [ ] Database schema documented

### Infrastructure
- [ ] Monitoring enabled
- [ ] Alerting configured
- [ ] Backup system running
- [ ] Load balancer configured (if needed)
- [ ] CDN configured (if using)

### Communication
- [ ] Team informed of deployment
- [ ] Changelog prepared
- [ ] Customer communication ready
- [ ] Support team briefed
- [ ] Status page updated

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| QA Lead | ______ | ______ | ______ |
| DevOps | ______ | ______ | ______ |
| Product Owner | ______ | ______ | ______ |
| Tech Lead | ______ | ______ | ______ |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-11 | Initial production upgrade |
| | | Session persistence |
| | | Address sync fix |
| | | Read more system |
| | | Performance optimizations |
| | | Enhanced about page |
| | | Smooth animations |

---

**Last Updated**: February 11, 2026
**Status**: Ready for Testing & Deployment
**Prepared By**: Development Team
