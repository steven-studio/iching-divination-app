import { Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';

export type PaymentMethod = 'apple_pay' | 'google_pay' | 'line_pay' | 'credit_card';

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

// LINE Pay 設定
const LINE_PAY_CONFIG = {
  channelId: process.env.EXPO_PUBLIC_LINE_PAY_CHANNEL_ID || 'your_line_pay_channel_id',
  channelSecret: process.env.EXPO_PUBLIC_LINE_PAY_CHANNEL_SECRET || 'your_line_pay_secret',
  merchantId: process.env.EXPO_PUBLIC_LINE_PAY_MERCHANT_ID || 'your_merchant_id',
  sandboxUrl: 'https://sandbox-api-pay.line.me',
  productionUrl: 'https://api-pay.line.me',
};

// Stripe 設定 (用於信用卡和 Apple/Google Pay)
const STRIPE_CONFIG = {
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_key',
};

class PaymentService {
  private generateOrderId(): string {
    return `iching_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateLinePaySignature(uri: string, body: string, nonce: string): Promise<string> {
    const message = LINE_PAY_CONFIG.channelSecret + uri + body + nonce;
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      message,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    return digest;
  }

  async processApplePay(request: PaymentRequest): Promise<PaymentResult> {
    try {
      if (Platform.OS !== 'ios') {
        return { success: false, error: 'Apple Pay 僅支援 iOS 裝置' };
      }

      // 這裡應該整合 Stripe 的 Apple Pay
      // 由於 Expo Go 限制，我們模擬付費流程
      console.log('[PaymentService] Processing Apple Pay:', request);
      
      return new Promise((resolve) => {
        Alert.alert(
          'Apple Pay',
          `確定要使用 Apple Pay 支付 ${request.currency} ${request.amount} 嗎？`,
          [
            { text: '取消', onPress: () => resolve({ success: false, error: '用戶取消' }) },
            {
              text: '確定',
              onPress: () => {
                // 模擬付費成功
                setTimeout(() => {
                  resolve({
                    success: true,
                    transactionId: `apple_pay_${this.generateOrderId()}`,
                  });
                }, 1500);
              },
            },
          ]
        );
      });
    } catch (error) {
      console.error('[PaymentService] Apple Pay error:', error);
      return { success: false, error: 'Apple Pay 付費失敗' };
    }
  }

  async processGooglePay(request: PaymentRequest): Promise<PaymentResult> {
    try {
      if (Platform.OS !== 'android') {
        return { success: false, error: 'Google Pay 僅支援 Android 裝置' };
      }

      // 這裡應該整合 Stripe 的 Google Pay
      console.log('[PaymentService] Processing Google Pay:', request);
      
      return new Promise((resolve) => {
        Alert.alert(
          'Google Pay',
          `確定要使用 Google Pay 支付 ${request.currency} ${request.amount} 嗎？`,
          [
            { text: '取消', onPress: () => resolve({ success: false, error: '用戶取消' }) },
            {
              text: '確定',
              onPress: () => {
                // 模擬付費成功
                setTimeout(() => {
                  resolve({
                    success: true,
                    transactionId: `google_pay_${this.generateOrderId()}`,
                  });
                }, 1500);
              },
            },
          ]
        );
      });
    } catch (error) {
      console.error('[PaymentService] Google Pay error:', error);
      return { success: false, error: 'Google Pay 付費失敗' };
    }
  }

  async processLinePay(request: PaymentRequest): Promise<PaymentResult> {
    try {
      console.log('[PaymentService] Processing LINE Pay:', request);
      
      const orderId = this.generateOrderId();
      const nonce = Date.now().toString();
      
      // LINE Pay API 請求
      const requestBody = {
        amount: request.amount,
        currency: request.currency,
        orderId: orderId,
        packages: [
          {
            id: 'iching_package',
            amount: request.amount,
            name: request.description,
            products: [
              {
                id: 'iching_divination',
                name: request.description,
                quantity: 1,
                price: request.amount,
              },
            ],
          },
        ],
        redirectUrls: {
          confirmUrl: 'https://your-app.com/payment/confirm',
          cancelUrl: 'https://your-app.com/payment/cancel',
        },
      };

      const uri = '/v3/payments/request';
      const bodyString = JSON.stringify(requestBody);
      const signature = await this.generateLinePaySignature(uri, bodyString, nonce);

      const response = await fetch(`${LINE_PAY_CONFIG.sandboxUrl}${uri}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-LINE-ChannelId': LINE_PAY_CONFIG.channelId,
          'X-LINE-Authorization-Nonce': nonce,
          'X-LINE-Authorization': signature,
        },
        body: bodyString,
      });

      const result = await response.json();
      
      if (result.returnCode === '0000') {
        // 開啟 LINE Pay 付費頁面
        const paymentUrl = result.info.paymentUrl.web;
        const browserResult = await WebBrowser.openBrowserAsync(paymentUrl);
        
        if (browserResult.type === 'opened') {
          // 在實際應用中，需要監聽回調來確認付費狀態
          // 這裡模擬用戶完成付費
          return new Promise((resolve) => {
            Alert.alert(
              'LINE Pay',
              '請在瀏覽器中完成付費，完成後點擊「付費完成」',
              [
                { text: '取消', onPress: () => resolve({ success: false, error: '用戶取消' }) },
                {
                  text: '付費完成',
                  onPress: () => resolve({
                    success: true,
                    transactionId: result.info.transactionId,
                  }),
                },
              ]
            );
          });
        }
      }
      
      return { success: false, error: 'LINE Pay 初始化失敗' };
    } catch (error) {
      console.error('[PaymentService] LINE Pay error:', error);
      return { success: false, error: 'LINE Pay 付費失敗' };
    }
  }

  async processCreditCard(request: PaymentRequest): Promise<PaymentResult> {
    try {
      console.log('[PaymentService] Processing Credit Card:', request);
      
      // 這裡應該整合 Stripe 的信用卡付費
      // 由於 Expo Go 限制，我們模擬付費流程
      return new Promise((resolve) => {
        Alert.alert(
          '信用卡付費',
          `確定要使用信用卡支付 ${request.currency} ${request.amount} 嗎？`,
          [
            { text: '取消', onPress: () => resolve({ success: false, error: '用戶取消' }) },
            {
              text: '確定',
              onPress: () => {
                // 模擬付費成功
                setTimeout(() => {
                  resolve({
                    success: true,
                    transactionId: `credit_card_${this.generateOrderId()}`,
                  });
                }, 2000);
              },
            },
          ]
        );
      });
    } catch (error) {
      console.error('[PaymentService] Credit Card error:', error);
      return { success: false, error: '信用卡付費失敗' };
    }
  }

  async processPayment(method: PaymentMethod, request: PaymentRequest): Promise<PaymentResult> {
    console.log(`[PaymentService] Processing payment with ${method}:`, request);
    
    switch (method) {
      case 'apple_pay':
        return this.processApplePay(request);
      case 'google_pay':
        return this.processGooglePay(request);
      case 'line_pay':
        return this.processLinePay(request);
      case 'credit_card':
        return this.processCreditCard(request);
      default:
        return { success: false, error: '不支援的付費方式' };
    }
  }

  getAvailablePaymentMethods(): PaymentMethod[] {
    const methods: PaymentMethod[] = ['credit_card', 'line_pay'];
    
    if (Platform.OS === 'ios') {
      methods.unshift('apple_pay');
    }
    
    if (Platform.OS === 'android') {
      methods.unshift('google_pay');
    }
    
    return methods;
  }
}

export const paymentService = new PaymentService();
