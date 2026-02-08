# Phone Authentication Setup Guide

## Features Implemented ✅

### 1. **Dual Authentication Methods**
- Email/Password authentication
- Phone number (OTP) authentication
- Seamless tab switching between methods

### 2. **Phone Authentication Flow**
- Sign up with phone number (+91 Indian numbers)
- Sign in with existing phone number
- OTP verification via SMS
- Resend OTP functionality
- Automatic phone number formatting

### 3. **User Interface**
- Clean tabbed interface (Email/Phone)
- OTP input screen with 6-digit code
- Full name collection during signup
- Country code prefix (+91) for Indian numbers
- Back button to change phone number

## Supabase Configuration Required

### Enable Phone Authentication in Supabase Dashboard:

1. **Go to**: https://supabase.com/dashboard/project/adgihdeigquuoozmvfai/auth/providers

2. **Enable Phone Provider**:
   - Click on "Phone" provider
   - Toggle "Enable Phone Sign-up"
   - Choose SMS provider (Twilio recommended)

3. **Configure SMS Provider (Twilio)**:
   - Get Twilio Account SID from: https://console.twilio.com
   - Get Twilio Auth Token
   - Get Twilio Phone Number (with SMS capability)
   - Add these credentials in Supabase dashboard

4. **OTP Settings**:
   - OTP length: 6 digits (default)
   - OTP expiry: 60 seconds (configurable)
   - Rate limiting: Enable to prevent abuse

## Testing the Integration

### Sign Up with Phone:
1. Navigate to `/auth`
2. Click "Sign Up"
3. Switch to "Phone" tab
4. Enter your name
5. Enter 10-digit mobile number (without +91)
6. Click "Create Account"
7. Enter the 6-digit OTP received via SMS
8. Click "Verify OTP"

### Sign In with Phone:
1. Navigate to `/auth`
2. Ensure "Sign In" is selected
3. Switch to "Phone" tab
4. Enter your 10-digit mobile number
5. Click "Sign In"
6. Enter the OTP received via SMS
7. Click "Verify OTP"

## Code Structure

### Files Modified:

1. **`src/hooks/useAuth.tsx`**
   - Added `signUpWithPhone()` method
   - Added `signInWithPhone()` method
   - Added `verifyOtp()` method
   - Added `resendOtp()` method

2. **`src/pages/Auth.tsx`**
   - Added Email/Phone tabs
   - Added phone number input with +91 prefix
   - Added OTP verification screen
   - Added OTP resend functionality
   - Added back navigation from OTP screen

## Phone Number Format

- **Input**: User enters 10 digits (e.g., `9876543210`)
- **Stored**: Automatically prefixed with `+91` (e.g., `+919876543210`)
- **Display**: Shows as `+91 9876543210`

## Security Features

- Phone number validation (10 digits only)
- OTP validation (6 digits only)
- Automatic OTP expiry
- Rate limiting protection
- Row Level Security (RLS) policies maintained

## Error Handling

- Invalid phone number format
- Incorrect OTP code
- Expired OTP
- Network errors
- Rate limit exceeded
- Phone number already registered

## User Experience Enhancements

- Auto-focus on OTP input
- Large, spaced OTP input field
- Clear error messages via toast notifications
- Loading states on all buttons
- Disabled state during API calls
- Smooth transitions between screens

## Next Steps (Optional)

1. **Add Country Code Selector**: Support multiple countries beyond +91
2. **Remember Me**: Save phone number locally (encrypted)
3. **WhatsApp Integration**: Option to receive OTP via WhatsApp
4. **Biometric Login**: Fingerprint/Face ID after first successful login
5. **Social Login**: Google, Facebook authentication alongside phone/email

## Troubleshooting

### OTP Not Received:
- Check Twilio account balance
- Verify phone number format (+91xxxxxxxxxx)
- Check SMS service logs in Twilio dashboard
- Verify Supabase project ID and credentials

### Authentication Errors:
- Ensure phone provider is enabled in Supabase
- Check Twilio credentials are correct
- Verify phone number is not blocked
- Check Supabase logs for detailed errors

## Support

For issues or questions:
- Check Supabase Auth documentation: https://supabase.com/docs/guides/auth/phone-login
- Review Twilio SMS documentation: https://www.twilio.com/docs/sms
- Check application console for error logs
