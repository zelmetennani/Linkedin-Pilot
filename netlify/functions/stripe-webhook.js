const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const sig = event.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Webhook signature verification failed' })
    };
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        const session = stripeEvent.data.object;
        await handleCheckoutCompleted(session);
        break;
      
      case 'customer.subscription.updated':
        const subscription = stripeEvent.data.object;
        await handleSubscriptionUpdated(subscription);
        break;
      
      case 'customer.subscription.deleted':
        const deletedSubscription = stripeEvent.data.object;
        await handleSubscriptionDeleted(deletedSubscription);
        break;
      
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook processing failed' })
    };
  }
};

async function handleCheckoutCompleted(session) {
  const { userId, plan } = session.metadata;
  
  if (!userId || !plan) {
    console.error('Missing userId or plan in session metadata');
    return;
  }

  try {
    await db.collection('users').doc(userId).update({
      plan: plan,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      planUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`User ${userId} upgraded to ${plan} plan`);
  } catch (error) {
    console.error('Error updating user plan:', error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  // Handle subscription changes (upgrades, downgrades, etc.)
  console.log('Subscription updated:', subscription.id);
}

async function handleSubscriptionDeleted(subscription) {
  // Handle subscription cancellations
  try {
    const userQuery = await db.collection('users')
      .where('stripeSubscriptionId', '==', subscription.id)
      .get();
    
    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      await userDoc.ref.update({
        plan: 'free',
        stripeSubscriptionId: null,
        planUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`User ${userDoc.id} downgraded to free plan`);
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
} 