# LinkedIn CoPilot - SaaS Edition

A complete SaaS application for generating LinkedIn post ideas with user authentication, usage tracking, and subscription payments.

## Features

- **Google Authentication**: Secure user sign-in with Firebase Auth
- **Usage Tracking**: Monitor user activity and enforce limits
- **Subscription Plans**: Free (5 generations), Pro ($19/month, 50 generations), Unlimited ($49/month)
- **Stripe Payments**: Secure payment processing with webhook handling
- **Responsive Design**: Modern UI that works on all devices

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Netlify Functions
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Payments**: Stripe
- **Deployment**: Netlify

## Setup Instructions

### 1. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Google provider
3. Create a Firestore database
4. Download your Firebase config and replace values in `firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 2. Stripe Setup

1. Create a Stripe account at [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create two products with recurring prices:
   - Pro Plan: $19/month
   - Unlimited Plan: $49/month
3. Note down your price IDs and replace in `payments.js`:

```javascript
this.prices = {
    pro: 'price_your_pro_price_id',
    unlimited: 'price_your_unlimited_price_id'
};
```

### 3. Netlify Environment Variables

Set these environment variables in your Netlify dashboard:

```
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRO_PRICE_ID=price_your_pro_price_id
STRIPE_UNLIMITED_PRICE_ID=price_your_unlimited_price_id

# Firebase Admin
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
```

### 4. Firebase Admin Setup

1. Go to Firebase Console > Project Settings > Service Accounts
2. Generate a new private key
3. Download the JSON file and extract the values for environment variables

### 5. Stripe Webhook Setup

1. In Stripe Dashboard, go to Webhooks
2. Add endpoint: `https://your-site.netlify.app/.netlify/functions/stripe-webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the webhook signing secret to your environment variables

### 6. Deploy to Netlify

1. Install dependencies:
```bash
npm install
```

2. Deploy:
```bash
netlify deploy --prod
```

## File Structure

```
├── index.html              # Main application
├── firebase-config.js      # Firebase configuration
├── auth.js                 # Authentication logic
├── payments.js             # Payment handling
├── netlify/
│   ├── functions/
│   │   ├── generateIdeas.js           # LinkedIn idea generation
│   │   ├── create-checkout-session.js # Stripe checkout
│   │   └── stripe-webhook.js          # Stripe webhooks
│   └── netlify.toml        # Netlify configuration
├── package.json            # Dependencies
└── README.md              # This file
```

## Usage Flow

1. **User Sign-in**: Users authenticate with Google
2. **Usage Tracking**: System tracks generations per user
3. **Limit Enforcement**: Free users limited to 5 generations
4. **Upgrade Prompt**: Users see upgrade modal when near limit
5. **Payment Processing**: Stripe handles subscription payments
6. **Plan Updates**: Webhooks update user plans automatically

## Pricing Plans

- **Free**: 5 generations per month
- **Pro**: $19/month - 50 generations per month
- **Unlimited**: $49/month - Unlimited generations

## Security Features

- Firebase Auth for secure authentication
- Stripe webhook signature verification
- Environment variable protection
- CORS headers for API security

## Customization

### Styling
Modify the CSS in `index.html` to match your brand colors and design.

### Pricing
Update prices in both the frontend modal and Stripe dashboard.

### Limits
Modify usage limits in `auth.js`:

```javascript
const limits = {
    free: 5,
    pro: 50,
    unlimited: 999999
};
```

## Troubleshooting

### Common Issues

1. **Firebase Auth not working**: Check Firebase config and enable Google Auth
2. **Stripe payments failing**: Verify webhook endpoint and environment variables
3. **Usage not tracking**: Check Firestore rules and user document creation

### Debug Mode

Enable console logging by adding this to your browser console:
```javascript
localStorage.setItem('debug', 'true');
```

## Support

For issues and questions:
1. Check the Firebase and Stripe documentation
2. Review Netlify function logs
3. Verify environment variables are set correctly

## License

MIT License - feel free to use this for your own projects! 