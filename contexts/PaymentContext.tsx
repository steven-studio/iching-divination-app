import { useCallback, useEffect, useMemo, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { storageGetItem, storageSetItem } from '@/utils/storage';
import { FREE_USES_LIMIT, PAYMENT_TYPE } from '@/constants/config';
import type { PaymentState } from '@/types/history';

const PAYMENT_STATE_KEY = 'iching_payment_state_v1';

const defaultPaymentState: PaymentState = {
  freeUsesRemaining: FREE_USES_LIMIT,
  totalUses: 0,
  hasPaid: false,
};

export const [PaymentProvider, usePayment] = createContextHook(() => {
  const [paymentState, setPaymentState] = useState<PaymentState>(defaultPaymentState);
  const [isLoading, setIsLoading] = useState(true);

  // Load payment state from storage on mount
  useEffect(() => {
    const loadPaymentState = async () => {
      try {
        const stored = await storageGetItem(PAYMENT_STATE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as PaymentState;
          setPaymentState(parsed);
        }
      } catch (error) {
        console.log('[PaymentContext] Failed to load payment state:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPaymentState();
  }, []);

  // Save payment state to storage whenever it changes
  const savePaymentState = useCallback(async (newState: PaymentState) => {
    try {
      await storageSetItem(PAYMENT_STATE_KEY, JSON.stringify(newState));
      setPaymentState(newState);
    } catch (error) {
      console.log('[PaymentContext] Failed to save payment state:', error);
    }
  }, []);

  const consumeFreeUse = useCallback(async () => {
    if (paymentState.freeUsesRemaining > 0) {
      const newState = {
        ...paymentState,
        freeUsesRemaining: paymentState.freeUsesRemaining - 1,
        totalUses: paymentState.totalUses + 1,
      };
      await savePaymentState(newState);
      return true;
    }
    return false;
  }, [paymentState, savePaymentState]);

  const markAsPaid = useCallback(async () => {
    if (PAYMENT_TYPE === 'unlimited') {
      // 無限使用模式：標記為已付費
      const newState = {
        ...paymentState,
        hasPaid: true,
        totalUses: paymentState.totalUses + 1,
      };
      await savePaymentState(newState);
    } else {
      // 按次付費模式：只增加使用次數
      const newState = {
        ...paymentState,
        totalUses: paymentState.totalUses + 1,
      };
      await savePaymentState(newState);
    }
  }, [paymentState, savePaymentState]);

  const canUseFree = paymentState.freeUsesRemaining > 0;
  const needsPayment = PAYMENT_TYPE === 'per_use' ? !canUseFree : (!canUseFree && !paymentState.hasPaid);

  return useMemo(() => ({
    paymentState,
    isLoading,
    canUseFree,
    needsPayment,
    consumeFreeUse,
    markAsPaid,
  }), [paymentState, isLoading, canUseFree, needsPayment, consumeFreeUse, markAsPaid]);
});
