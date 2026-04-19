# PANDIYIN – Nature In Pack

A modern full-stack e-commerce platform for selling authentic homemade food products from Madurai.  
The platform enables customers to browse products, manage carts, checkout securely, and make payments online.

Live Website:  
https://pandiyin-natureinpack.vercel.app/

---

## Features

• Modern responsive UI optimized for mobile and desktop  
• Secure authentication with Google OAuth  
• Product catalog with categories and search functionality  
• Add to cart and dynamic cart management  
• Checkout system with address management  
• GPS based address auto-fill for faster checkout  
• Delivery charge calculation based on location and weight  
• Secure online payments using Razorpay  
• Customer reviews and rating system  
• Admin panel for product management and image uploads  
• SEO optimized pages with sitemap and meta tags  
• Performance optimized loading and mobile navigation

---

## Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- Vite

### Backend
- Supabase (Database, Auth, Storage)

### Payment Integration
- Razorpay Payment Gateway

### Deployment
- Vercel (Frontend hosting)

### Authentication
- Google OAuth

---

## System Architecture

User  
↓  
React Frontend  
↓  
Supabase Backend (Auth + Database + Storage)  
↓  
Razorpay Payment Gateway  

---

## Installation

Clone the repository

```bash
git clone https://github.com/yourusername/pandiyin-nature-in-pack.git
cd pandiyin-nature-in-pack
```

Install dependencies

```bash
npm install
```

Run the development server

```bash
npm run dev
```

---

## Environment Variables

Create a `.env` file in the root directory.

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key
```

---

## Deployment

The application is deployed using **Vercel**.

Steps:

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy

---

## Security Features

• OAuth based authentication  
• Environment variable protection  
• Secure payment processing  
• API request validation  
• Protected admin operations  

---

## Future Improvements

• Order tracking system  
• Admin analytics dashboard  
• AI based product recommendations  
• Coupon and discount system  
• Delivery partner integration 

---
