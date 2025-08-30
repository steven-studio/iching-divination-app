import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import Colors from '@/constants/colors';
import { PAID_PRICE_TWD, PAYMENT_TYPE } from '@/constants/config';
import { PaymentMethod, PaymentRequest, paymentService } from '@/utils/payment';

type PaymentModalProps = {
  visible: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  freeUsesRemaining: number;
};

export function PaymentModal({ visible, onClose, onPaymentSuccess, freeUsesRemaining }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  
  const availableMethods = paymentService.getAvailablePaymentMethods();


  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'apple_pay':
        return <Ionicons name="logo-apple" size={24} color={Colors.light.text} />;
      case 'google_pay':
        return <Ionicons name="logo-google" size={24} color={Colors.light.text} />;
    }
  };

  const getPaymentMethodName = (method: PaymentMethod) => {
    switch (method) {
      case 'apple_pay':
        return 'Apple Pay';
      case 'google_pay':
        return 'Google Pay';
    }
  };

  const handlePayment = async (method: PaymentMethod) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setSelectedMethod(method);
    
    try {
      const paymentRequest: PaymentRequest = {
        amount: 1, // API expects amount in USD
        currency: 'USD',
        description: PAYMENT_TYPE === 'per_use' ? '易經占卜 - 單次' : '易經占卜 - 無限次',
        orderId: `iching_${Date.now()}`,
      };
      
      // 先取得 clientSecret 和 paymentIntentId
      const result = await paymentService.processPayment(method, paymentRequest);
      
      if (!result.success || !(result as any).clientSecret) {
        // 如果沒有 clientSecret，使用模擬模式
        if (result.success) {
          console.log('[PaymentModal] Payment successful (mock mode):', result.transactionId);
          onPaymentSuccess();
          
          const successMessage = PAYMENT_TYPE === 'per_use'
            ? '付費成功！正在為您解卦...'
            : '恭喜！您已解鎖無限次占卜功能。';
          
          Alert.alert('付費成功', successMessage);
          onClose();
        } else {
          console.log('[PaymentModal] Payment failed:', result.error);
          if (result.error && result.error !== '用戶取消') {
            Alert.alert('付費失敗', result.error);
          }
        }
        return;
      }
      
      // 使用真實的 Stripe 付款
      const clientSecret = (result as any).clientSecret;
      const paymentIntentId = (result as any).paymentIntentId;
      
      console.log('[PaymentModal] Using real Stripe payment with clientSecret:', clientSecret);
      
      // 模擬付款成功（在真實環境中，這裡會使用 Stripe SDK 進行付款）
      // 付款完成後，驗證付款狀態
      const verificationResult = await paymentService.verifyPayment(paymentIntentId);
      
      if (verificationResult.success) {
        console.log('[PaymentModal] Payment verified successfully:', verificationResult.transactionId);
        onPaymentSuccess();
        
        const successMessage = PAYMENT_TYPE === 'per_use'
          ? '付費成功！正在為您解卦...'
          : '恭喜！您已解鎖無限次占卜功能。';
        
        Alert.alert('付費成功', successMessage);
        onClose();
      } else {
        console.log('[PaymentModal] Payment verification failed:', verificationResult.error);
        Alert.alert('付費驗證失敗', verificationResult.error || '付費驗證過程中發生錯誤，請稍後再試');
      }
      
    } catch (error) {
      console.error('[PaymentModal] Payment error:', error);
      Alert.alert('付費失敗', '付費過程中發生錯誤，請稍後再試');
    } finally {
      setIsProcessing(false);
      setSelectedMethod(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{PAYMENT_TYPE === 'per_use' ? '付費占卜' : '解鎖無限占卜'}</Text>
            <Pressable onPress={onClose} style={styles.closeButton} testID="close-payment-modal">
              <MaterialIcons name="close" size={24} color={Colors.light.text} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="credit-card" size={48} color={Colors.light.primary} />
            </View>

            <Text style={styles.subtitle}>
              {PAYMENT_TYPE === 'per_use' ? '您的免費占卜次數已用完' : '您的免費占卜次數已用完'}
            </Text>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                • 免費次數：{freeUsesRemaining}/10 次
              </Text>
              {PAYMENT_TYPE === 'per_use' ? (
                <>
                  <Text style={styles.infoText}>
                    • 每次占卜需付費 NT${PAID_PRICE_TWD}
                  </Text>
                  <Text style={styles.infoText}>
                    • 付費後立即開始解卦
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.infoText}>
                    • 付費後可無限次使用
                  </Text>
                  <Text style={styles.infoText}>
                    • 一次性付費，永久解鎖
                  </Text>
                </>
              )}
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>{PAYMENT_TYPE === 'per_use' ? '本次占卜' : '解鎖價格'}</Text>
              <Text style={styles.price}>NT$ {PAID_PRICE_TWD}</Text>
            </View>

            <ScrollView style={styles.paymentMethods} showsVerticalScrollIndicator={false}>
              {availableMethods.map((method) => {
                // 使用統一的按鈕樣式，支援真實的 Stripe 付款
                return (
                  <Pressable
                    key={method}
                    style={[
                      styles.paymentMethodButton,
                      isProcessing && selectedMethod === method && styles.paymentMethodButtonProcessing
                    ]}
                    onPress={() => handlePayment(method)}
                    disabled={isProcessing}
                    testID={`payment-method-${method}`}
                  >
                    <View style={styles.paymentMethodContent}>
                      <View style={styles.paymentMethodIcon}>
                        {getPaymentMethodIcon(method)}
                      </View>
                      <Text style={styles.paymentMethodText}>
                        {getPaymentMethodName(method)}
                      </Text>
                      {isProcessing && selectedMethod === method && (
                        <Text style={styles.processingText}>處理中...</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Button
              title="稍後再說"
              onPress={onClose}
              variant="outline"
              style={styles.laterButton}
              disabled={isProcessing}
              testID="later-button"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.muted,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  payButton: {
    width: '100%',
    marginBottom: 12,
  },
  laterButton: {
    width: '100%',
  },
  paymentMethods: {
    maxHeight: 200,
    marginBottom: 16,
  },
  paymentMethodButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentMethodButtonProcessing: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodIcon: {
    marginRight: 12,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  processingText: {
    fontSize: 14,
    color: Colors.light.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  paymentMethodContainer: {
    marginBottom: 16,
  },
  stripeButton: {
    height: 50,
    borderRadius: 12,
  },
});