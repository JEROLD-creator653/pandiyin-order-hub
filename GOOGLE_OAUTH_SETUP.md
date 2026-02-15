# Google OAuth Setup Guide

## ✅ Code Implementation Complete

All code changes for Google Sign-In have been implemented:

- ✅ `signInWithGoogle()` method added to useAuth hook
- ✅ Google Sign-In button with professional styling
- ✅ OR divider between email and Google login
- ✅ `/auth/callback` page for OAuth redirect handling
- ✅ Auto-redirect if user already logged in
- ✅ Session persistence after OAuth login

## 🔧 Supabase Dashboard Configuration

To enable Google Sign-In, configure these settings in your Supabase dashboard:

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Configure OAuth consent screen if prompted:
   - User Type: **External**
   - App name: **PANDIYIN Order Hub**
   - User support email: Your email
   - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: **PANDIYIN Supabase**
   - Authorized redirect URIs:
     ```
     https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
     ```
     Example: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**

### 2. Configure in Supabase

1. Open your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Authentication** → **Providers**
4. Find **Google** in the list and click to expand
5. Enable Google provider
6. Enter your Google credentials:
   - **Client ID**: Paste from Google Cloud Console
   - **Client Secret**: Paste from Google Cloud Console
7. Copy the callback URL shown (should match what you added in Google Console)
8. Click **Save**

### 3. Test the Integration

1. Navigate to `http://localhost:5173/auth` (or your dev URL)
2. Click **"Continue with Google"** button
3. You should be redirected to Google sign-in
4. After signing in with Google, you'll be redirected to `/auth/callback`
5. If successful, you'll be logged in and redirected to homepage

### 4. Production Setup

For production (Vercel deployment):

1. In Google Cloud Console, add production redirect URI:
   ```
   https://pandiyin-naturein-pack.vercel.app/auth/callback
   ```
   (**Note**: The useAuth hook uses `window.location.origin/auth/callback` so it will work automatically in any environment)

2. The OAuth flow will work automatically because the code uses dynamic redirect:
   ```typescript
   redirectTo: `${window.location.origin}/auth/callback`
   ```

## 🎨 UI Features

### Google Button Design
- White background with gray border
- Official Google logo (4-color SVG)
- "Continue with Google" text
- Hover effects: shadow + border color change
- Loading state with spinner

### User Experience
- Email/password login still fully functional
- OR divider separates the two login methods
- Auto-redirect if already logged in
- Proper error handling with toast notifications
- Session persisted in localStorage

## 🔒 Security Notes

- OAuth callback validates session before redirecting
- Failed OAuth attempts redirect back to /auth after 2 seconds
- Session stored securely via Supabase Auth
- No client-side credential storage

## 📱 Mobile Responsive

The Google Sign-In button is fully responsive:
- Full width on mobile
- Proper touch targets (44px height)
- Clear visual feedback on tap/click

## 🚀 Testing Checklist

Before going live:

- [ ] Google OAuth credentials configured in Supabase
- [ ] Development redirect URI added to Google Console
- [ ] Production redirect URI added to Google Console
- [ ] Test sign-up with Google (new account)
- [ ] Test sign-in with Google (existing account)
- [ ] Test email/password still works
- [ ] Test auto-redirect when logged in
- [ ] Test session persistence after refresh

## 🐛 Troubleshooting

**"Invalid redirect URI"**
- Double-check the callback URL matches exactly in both Google Console and Supabase

**"Google provider not enabled"**
- Make sure you clicked Save in Supabase Authentication → Providers

**User redirects to /auth instead of /**
- Check AuthCallback.tsx error handling
- Check browser console for session errors

**Google button doesn't do anything**
- Open browser console to see error messages
- Verify signInWithGoogle() is imported in Auth.tsx

## 📄 Code Files Modified

- `src/hooks/useAuth.tsx` - Added signInWithGoogle method
- `src/pages/Auth.tsx` - Added Google button, OR divider, auto-redirect
- `src/pages/AuthCallback.tsx` - New OAuth callback handler
- `src/App.tsx` - Added /auth/callback route

## 🎯 Next Steps

1. Apply pending security migrations to Supabase:
   - `supabase/migrations/20260215_security_fixes.sql`
   - `supabase/migrations/20260215_security_hardening.sql`
   - `supabase/migrations/20260215_check_email_exists.sql`

2. Configure Google OAuth in Supabase dashboard (follow steps above)

3. Test the complete authentication flow

4. Deploy to production with production redirect URI
