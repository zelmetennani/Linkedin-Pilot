const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { plan, userId, email } = JSON.parse(event.body);

    if (!plan || !userId || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Define your pricing plans
    const plans = {
      pro: {
        priceId: process.env.STRIPE_PRO_PRICE_ID,
        name: 'Pro Plan',
        description: '50 generations per month'
      },
      unlimited: {
        priceId: process.env.STRIPE_UNLIMITED_PRICE_ID,
        name: 'Unlimited Plan',
        description: 'Unlimited generations'
      }
    };

    const selectedPlan = plans[plan];
    if (!selectedPlan) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid plan' })
      };
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/cancel`,
      customer_email: email,
      metadata: {
        userId: userId,
        plan: plan
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ id: session.id })
    };
  } catch (error) {
    console.error('Stripe error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to create checkout session' })
    };
  }
}; 