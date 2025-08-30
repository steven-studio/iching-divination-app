// api/create-payment-intent.js
import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { amount, currency, description, orderId } = req.body || {};

    if (!amount || !currency || !orderId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: String(currency).toLowerCase(),
      description,
      metadata: { orderId, app: 'iching-divination' },
      automatic_payment_methods: { enabled: true },
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error('create-payment-intent error:', err);
    // 把訊息吐回來，之後好排錯
    return res.status(500).json({ error: 'Internal Server Error', message: String(err.message) });
  }
}