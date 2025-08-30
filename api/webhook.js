// api/webhook.js
// 安裝依賴：npm i stripe raw-body
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const getRawBody = require('raw-body');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let event;
  try {
    // 取得 Stripe 傳來的原始 body（不能先被 JSON 解析）
    const rawBody = await getRawBody(req);
    const sig = req.headers['stripe-signature'];

    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET // 從 Stripe Dashboard 新增 endpoint 後會給 whsec_ 開頭的簽章密鑰
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // 處理各種事件
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object; // PaymentIntent
        console.log('✅ payment_intent.succeeded:', pi.id);

        // TODO: 寫入你的資料庫（去重：使用 event.id 作為 idempotency key）
        // - 標記訂閱/解鎖功能
        // - 紀錄 userId / orderId 可從 pi.metadata 取得
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        console.log('❌ payment_intent.payment_failed:', pi.id, pi.last_payment_error?.message);
        // TODO: 記錄失敗、通知用戶或觸發重試流程
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object;
        console.log('↩️ charge.refunded:', charge.id);
        // TODO: 同步退款狀態
        break;
      }
      // 需要其他事件再加
      default:
        console.log('Unhandled event type:', event.type);
    }

    // 一定要回 200，Stripe 才不會持續重送
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    // 回 500 讓 Stripe 之後重送（其會自動重試幾次）
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
};