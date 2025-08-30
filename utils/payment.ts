import { API_CONFIG } from '@/constants/config';
import { Alert, Platform } from 'react-native';

// Dynamic import for Stripe to avoid web bundling issues
let stripeModule: any = null;

const getStripeModule = async () => {
  if (Platform.OS === 'web') {
    // Return web stub for web platform
    return {
      initStripe: () => Promise.resolve(),
      StripeProvider: ({ children }: any) => children,
      useStripe: () => ({}),
    };
  }
  
  if (!stripeModule) {
    try {
      // Dynamic import for native platforms
      stripeModule = await import('@stripe/stripe-react-native');
    } catch (error) {
      console.warn('[PaymentService] Stripe not available:', error);
      return null;
    }
  }
  
  return stripeModule;
};

export type PaymentMethod = 'apple_pay' | 'google_pay';

export interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  orderId: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  clientSecret?: string;
  paymentIntentId?: string;
}

class PaymentService {
  private isInitialized = false;

  private generateOrderId(): string {
    return `iching_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private normalizeRequest(req: PaymentRequest): PaymentRequest | null {
    const amount = Number(req.amount);
    const currency = String(req.currency || '').toLowerCase().trim();
    const allowed = new Set(['usd', 'eur', 'twd', 'jpy', 'hkd', 'sgd']); // 依實際支援調整

    if (!Number.isFinite(amount) || amount <= 0) return null;
    if (!allowed.has(currency)) return null;

    return {
      amount: Math.round((amount + Number.EPSILON) * 100) / 100,
      currency,
      description: req.description?.slice(0, 120) ?? '',
      orderId: req.orderId || this.generateOrderId(),
    };
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        throw new Error('[PaymentService] Missing EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      }

      const stripe = await getStripeModule();
      if (!stripe || !stripe.initStripe) {
        throw new Error('[PaymentService] Stripe not available on this platform');
      }

      const merchantIdentifier = process.env.EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID;
      if (Platform.OS === 'ios' && !merchantIdentifier) {
        throw new Error('[PaymentService] Missing EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID');
      }
      
      await stripe.initStripe({
        publishableKey,
        ...(Platform.OS === 'ios' ? { merchantIdentifier } : {}),
      });
      this.isInitialized = true;
      console.log('[PaymentService] Stripe initialized successfully');
    } catch (error) {
      console.error('[PaymentService] Failed to initialize Stripe:', error);
      this.isInitialized = false;
    }
  }

  private async createPaymentIntent(request: PaymentRequest): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
    try {
      const safeReq = this.normalizeRequest(request);
      if (!safeReq) {
        console.error('[PaymentService] Invalid payment request:', request);
        return null;
      }

      const response = await fetch(`${API_CONFIG.paymentEndpoint}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(safeReq),
      });

      if (!response.ok) {
        let msg = `HTTP ${response.status}`;
        try { msg += ` ${await response.text()}`; } catch {}
        console.error('[PaymentService] Failed to create payment intent:', msg);
        return null;
      }

      const data = await response.json();
      if (!data?.clientSecret || !data?.paymentIntentId) {
        console.error('[PaymentService] Malformed PI response:', data);
        return null;
      }

      return { clientSecret: data.clientSecret, paymentIntentId: data.paymentIntentId };
    } catch (error) {
      console.error('[PaymentService] Failed to create payment intent:', error);
      return null;
    }
  }



  async processApplePay(request: PaymentRequest): Promise<PaymentResult> {
    try {
      if (Platform.OS === 'web') return { success: false, error: 'Web 不支援 Apple Pay' };
      if (Platform.OS !== 'ios') return { success: false, error: 'Apple Pay 僅支援 iOS 裝置' };

      await this.initialize();
      
      const isDev = __DEV__ === true;
      if (!this.isInitialized) {
        if (isDev) return this.mockApplePay(request);
        return { success: false, error: 'Stripe 初始化失敗（上架版不允許 mock）' };
      }

      const paymentIntent = await this.createPaymentIntent(request);
      if (!paymentIntent) {
        if (isDev) return this.mockApplePay(request);
        return { success: false, error: '建立 PaymentIntent 失敗' };
      }

      // Apple Pay 需要在 React 組件中使用 ApplePayButton 組件
      // 這裡返回 clientSecret 供組件使用
      return { success: true, transactionId: request.orderId, ...paymentIntent };
    } catch (error) {
      console.error('[PaymentService] Apple Pay error:', error);
      return { success: false, error: 'Apple Pay 付費失敗' };
    }
  }

  private async mockApplePay(request: PaymentRequest): Promise<PaymentResult> {
    return new Promise((resolve) => {
      Alert.alert(
        'Apple Pay (測試模式)',
        `確定要使用 Apple Pay 支付 ${request.currency} ${request.amount} 嗎？\n\n⚠️ 這是測試模式，不會真正扣款`,
        [
          { text: '取消', onPress: () => resolve({ success: false, error: '用戶取消' }) },
          {
            text: '確定',
            onPress: () => {
              setTimeout(() => {
                resolve({
                  success: true,
                  transactionId: `mock_apple_pay_${this.generateOrderId()}`,
                });
              }, 1500);
            },
          },
        ]
      );
    });
  }

  async processGooglePay(request: PaymentRequest): Promise<PaymentResult> {
    try {
      if (Platform.OS === 'web') return { success: false, error: 'Web 不支援 Google Pay' };
      if (Platform.OS !== 'android') return { success: false, error: 'Google Pay 僅支援 Android 裝置' };

      await this.initialize();
      
      const isDev = __DEV__ === true;
      if (!this.isInitialized) {
        if (isDev) return this.mockGooglePay(request);
        return { success: false, error: 'Stripe 初始化失敗（上架版不允許 mock）' };
      }

      const paymentIntent = await this.createPaymentIntent(request);
      if (!paymentIntent) {
        console.log('[PaymentService] Failed to create payment intent, using mock mode');
        return this.mockGooglePay(request);
      }

      // Google Pay 需要在 React 組件中使用 GooglePayButton 組件
      // 這裡返回 clientSecret 供組件使用
      return { success: true, transactionId: request.orderId, ...paymentIntent };
    } catch (error) {
      console.error('[PaymentService] Google Pay error:', error);
      return { success: false, error: 'Google Pay 付費失敗' };
    }
  }

  private async mockGooglePay(request: PaymentRequest): Promise<PaymentResult> {
    return new Promise((resolve) => {
      Alert.alert(
        'Google Pay (測試模式)',
        `確定要使用 Google Pay 支付 ${request.currency} ${request.amount} 嗎？\n\n⚠️ 這是測試模式，不會真正扣款`,
        [
          { text: '取消', onPress: () => resolve({ success: false, error: '用戶取消' }) },
          {
            text: '確定',
            onPress: () => {
              setTimeout(() => {
                resolve({ success: true, transactionId: `mock_google_pay_${this.generateOrderId()}` });
              }, 1500);
            },
          },
        ]
      );
    });
  }





  async processPayment(method: PaymentMethod, request: PaymentRequest): Promise<PaymentResult> {
    console.log(`[PaymentService] Processing payment with ${method}:`, request);
    
    switch (method) {
      case 'apple_pay':
        return this.processApplePay(request);
      case 'google_pay':
        return this.processGooglePay(request);
      default:
        return { success: false, error: '不支援的付費方式' };
    }
  }

  async verifyPayment(paymentIntentId: string): Promise<{ success: boolean; error?: string; transactionId?: string; amount?: number; currency?: string; status?: string }> {
    try {
      const response = await fetch(`${API_CONFIG.paymentEndpoint}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentIntentId }),
      });

      if (!response.ok) {
        let msg = `HTTP ${response.status}`;
        try { msg += ` ${await response.text()}`; } catch {}
        return { success: false, error: msg };
      }

      const data = await response.json();
      return {
        success: data.success,
        transactionId: data.transactionId,
        amount: data.amount,
        currency: data.currency,
        status: data.status
      };
    } catch (error) {
      console.error('[PaymentService] Payment verification error:', error);
      return { success: false, error: '驗證過程發生錯誤' };
    }
  }

  getAvailablePaymentMethods(): PaymentMethod[] {
    if (Platform.OS === 'ios') return ['apple_pay'];
    if (Platform.OS === 'android') return ['google_pay'];
    return []; // web 上架不顯示
  }
}

export const paymentService = new PaymentService();