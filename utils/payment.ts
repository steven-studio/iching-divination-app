import { API_CONFIG } from '@/constants/config';
import { Alert, Platform } from 'react-native';

// Only import Stripe on native platforms to avoid web bundling issues
let initStripe: any = null;
if (Platform.OS !== 'web') {
  try {
    const stripe = require('@stripe/stripe-react-native');
    initStripe = stripe.initStripe;
  } catch (error) {
    console.warn('[PaymentService] Stripe not available:', error);
  }
}

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
}

class PaymentService {
  private isInitialized = false;

  private generateOrderId(): string {
    return `iching_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        console.warn('[PaymentService] Stripe publishable key not found - using mock mode');
        this.isInitialized = false;
        return;
      }

      if (!initStripe) {
        console.warn('[PaymentService] Stripe not available on this platform');
        this.isInitialized = false;
        return;
      }
      
      await initStripe({
        publishableKey,
        merchantIdentifier: 'merchant.com.yourapp.iching',
      });
      this.isInitialized = true;
      console.log('[PaymentService] Stripe initialized successfully');
    } catch (error) {
      console.error('[PaymentService] Failed to initialize Stripe:', error);
      this.isInitialized = false;
    }
  }

  private async createPaymentIntent(request: PaymentRequest): Promise<{ clientSecret: string } | null> {
    try {
      console.log('[PaymentService] Creating payment intent for:', request);
      
      const response = await fetch(`${API_CONFIG.paymentEndpoint}/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: request.amount * 100, // Stripe uses cents
          currency: request.currency.toLowerCase(),
          description: request.description,
          orderId: request.orderId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[PaymentService] Failed to create payment intent:', errorData);
        return null;
      }

      const data = await response.json();
      return { clientSecret: data.clientSecret };
    } catch (error) {
      console.error('[PaymentService] Failed to create payment intent:', error);
      return null;
    }
  }



  async processApplePay(request: PaymentRequest): Promise<PaymentResult> {
    try {
      if (Platform.OS === 'web') {
        return this.mockApplePay(request);
      }
      
      if (Platform.OS !== 'ios') {
        return { success: false, error: 'Apple Pay 僅支援 iOS 裝置' };
      }

      await this.initialize();
      
      if (!this.isInitialized) {
        console.log('[PaymentService] Stripe not initialized, using mock mode');
        return this.mockApplePay(request);
      }

      const paymentIntent = await this.createPaymentIntent(request);
      if (!paymentIntent) {
        console.log('[PaymentService] Failed to create payment intent, using mock mode');
        return this.mockApplePay(request);
      }

      // Apple Pay 需要在 React 組件中使用 ApplePayButton 組件
      // 這裡返回 clientSecret 供組件使用
      return {
        success: true,
        transactionId: request.orderId,
        clientSecret: paymentIntent.clientSecret,
      } as any;
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
      if (Platform.OS === 'web') {
        return this.mockGooglePay(request);
      }
      
      if (Platform.OS !== 'android') {
        return { success: false, error: 'Google Pay 僅支援 Android 裝置' };
      }

      await this.initialize();
      
      if (!this.isInitialized) {
        console.log('[PaymentService] Stripe not initialized, using mock mode');
        return this.mockGooglePay(request);
      }

      const paymentIntent = await this.createPaymentIntent(request);
      if (!paymentIntent) {
        console.log('[PaymentService] Failed to create payment intent, using mock mode');
        return this.mockGooglePay(request);
      }

      // Google Pay 需要在 React 組件中使用 GooglePayButton 組件
      // 這裡返回 clientSecret 供組件使用
      return {
        success: true,
        transactionId: request.orderId,
        clientSecret: paymentIntent.clientSecret,
      } as any;
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
                resolve({
                  success: true,
                  transactionId: `mock_google_pay_${this.generateOrderId()}`,
                });
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

  private async verifyPayment(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_CONFIG.paymentEndpoint}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        return { success: false, error: '驗證請求失敗' };
      }

      const data = await response.json();
      return { success: data.success };
    } catch (error) {
      console.error('[PaymentService] Payment verification error:', error);
      return { success: false, error: '驗證過程發生錯誤' };
    }
  }

  getAvailablePaymentMethods(): PaymentMethod[] {
    const methods: PaymentMethod[] = [];
    
    if (Platform.OS === 'ios') {
      methods.push('apple_pay');
    }
    
    if (Platform.OS === 'android') {
      methods.push('google_pay');
    }
    
    // On web, show both options for testing
    if (Platform.OS === 'web') {
      methods.push('apple_pay', 'google_pay');
    }
    
    return methods;
  }
}

export const paymentService = new PaymentService();