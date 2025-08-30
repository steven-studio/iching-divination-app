// api/verify-payment.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment Intent ID is required' });
    }

    // 從 Stripe 取回 PaymentIntent 狀態
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // ✅ 支付成功，你可以在這裡加上後端邏輯（寫 DB、更新用戶狀態、寄信）
      return res.json({
        success: true,
        transactionId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      });
    } else {
      // 支付還沒成功
      return res.json({
        success: false,
        status: paymentIntent.status,
      });
    }
  } catch (err) {
    console.error('Verify payment error:', err);
    return res.status(500).json({
      error: 'Failed to verify payment',
      message: err.message,
    });
  }
};