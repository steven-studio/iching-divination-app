import { Button } from "@/components/Button";
import { HistoryList } from "@/components/HistoryList";
import { DigitInput, TextArea } from "@/components/Inputs";
import { PaymentModal } from "@/components/PaymentModal";
import { ResultCard } from "@/components/ResultCard";
import Colors from "@/constants/colors";
import { HISTORY_MAX, PAID_PRICE_TWD } from "@/constants/config";
import { usePayment } from "@/contexts/PaymentContext";
import type { HistoryItem } from "@/types/history";
import { postDivination, type DivinationResponse } from "@/utils/api";
import { detectLocale } from "@/utils/locale";
import { storageGetItem, storageSetItem } from "@/utils/storage";
import { normalizeDigits, pad3, validateForm } from "@/utils/validation";
import { MaterialIcons } from '@expo/vector-icons';
import { useMutation } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

type FormState = {
  n1: string;
  n2: string;
  n3: string;
  question: string;
};

const HISTORY_KEY = "iching_history_v1";

export default function DivinationScreen() {
  const [form, setForm] = useState<FormState>({ n1: "", n2: "", n3: "", question: "" });
  const [errors, setErrors] = useState<{ n1?: string; n2?: string; n3?: string; question?: string }>({});
  const [result, setResult] = useState<DivinationResponse | undefined>(undefined);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [locale, setLocale] = useState<string>("zh-TW");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const startedAtRef = useRef<number | undefined>(undefined);
  const n1Ref = useRef<TextInput>(null);
  const n2Ref = useRef<TextInput>(null);
  const n3Ref = useRef<TextInput>(null);
  
  const { paymentState, canUseFree, needsPayment, consumeFreeUse, markAsPaid, isLoading: paymentLoading } = usePayment();

  useEffect(() => {
    const l = detectLocale();
    setLocale(l);
    void (async () => {
      const raw = await storageGetItem(HISTORY_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as HistoryItem[];
          if (Array.isArray(parsed)) {
            // 過濾掉不完整的歷史記錄（向後兼容）
            const validHistory = parsed.filter((item) => 
              item.question && item.lowerTrigram && item.upperTrigram && item.explanation
            );
            setHistory(validHistory);
          } else {
            setHistory([]);
          }
        } catch {
          setHistory([]);
        }
      }
    })();
  }, []);

  const onChangeN = useCallback((key: "n1" | "n2" | "n3", v: string) => {
    const normalized = normalizeDigits(v, 3);
    setForm((prev) => ({ ...prev, [key]: normalized }));
    
    // 自動跳轉到下一個輸入框
    if (normalized.length === 3) {
      if (key === "n1" && n2Ref.current) {
        n2Ref.current.focus();
      } else if (key === "n2" && n3Ref.current) {
        n3Ref.current.focus();
      }
    }
  }, []);

  const onBlurPad = useCallback((key: "n1" | "n2" | "n3") => {
    setForm((prev) => ({ ...prev, [key]: pad3(prev[key]) }));
  }, []);

  const onChangeQuestion = useCallback((v: string) => {
    setForm((prev) => ({ ...prev, question: v }));
  }, []);

  const mutation = useMutation({
    mutationKey: ["divination"],
    mutationFn: async () => {
      const body = {
        n1: Number(form.n1),
        n2: Number(form.n2),
        n3: Number(form.n3),
        question: form.question.trim(),
        locale,
      };
      startedAtRef.current = Date.now();
      return await postDivination(body);
    },
    onMutate: () => {
      console.log("[track] divination_submit", {
        n1_valid: form.n1.length === 3,
        n2_valid: form.n2.length === 3,
        n3_valid: form.n3.length === 3,
        q_len: form.question.trim().length,
        locale,
      });
    },
    onSuccess: async (data) => {
      setResult(data);
      const elapsed = startedAtRef.current ? Date.now() - startedAtRef.current : undefined;
      console.log("[track] divination_success", { hexagramName: data.hexagramName, changingLine: data.changingLine, ms: elapsed });
      const item: HistoryItem = {
        timestamp: Date.now(),
        n1: Number(form.n1),
        n2: Number(form.n2),
        n3: Number(form.n3),
        question: form.question.trim(),
        hexagramName: data.hexagramName,
        changingLine: data.changingLine,
        lowerTrigram: data.lowerTrigram,
        upperTrigram: data.upperTrigram,
        explanation: data.explanation,
      };
      const next = [item, ...history].slice(0, HISTORY_MAX);
      setHistory(next);
      await storageSetItem(HISTORY_KEY, JSON.stringify(next));
    },
    onError: (err) => {
      console.log("[track] divination_error", { error: err instanceof Error ? err.message : String(err) });
    },
  });

  const submit = useCallback(async () => {
    const vErrs = validateForm({ ...form });
    setErrors(vErrs);
    if (Object.keys(vErrs).length > 0) return;
    
    // 檢查是否需要付費
    if (needsPayment) {
      setShowPaymentModal(true);
      return;
    }
    
    // 如果是免費使用，先消耗一次免費次數
    if (canUseFree) {
      const consumed = await consumeFreeUse();
      if (!consumed) {
        setShowPaymentModal(true);
        return;
      }
    }
    
    mutation.mutate();
  }, [form, needsPayment, canUseFree, consumeFreeUse, mutation.mutate]);

  const resetForAgain = useCallback(() => {
    setForm({ n1: "", n2: "", n3: "", question: "" });
    setErrors({});
    setResult(undefined);
  }, []);
  
  const handlePaymentSuccess = useCallback(async () => {
    await markAsPaid();
    setShowPaymentModal(false);
    // 付費成功後自動提交表單
    mutation.mutate();
  }, [markAsPaid, mutation.mutate]);
  
  const handleClosePaymentModal = useCallback(() => {
    setShowPaymentModal(false);
  }, []);

  const headerTitle = useMemo(() => "易經占卜", []);

  return (
    <>
      <Stack.Screen
        options={{
          title: headerTitle,
          headerRight: () => (
            <Pressable onPress={resetForAgain} accessibilityRole="button" accessibilityLabel="再次占卜" hitSlop={10} testID="again-icon-button" style={{ padding: 4 }}>
              <MaterialIcons name="refresh" size={24} color={Colors.light.primary} />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.hero} testID="hero">
            <View style={styles.heroTop}>
              <View style={styles.heroTexts}>
                <Text style={styles.h1}>易經占卜</Text>
                <Text style={styles.subtitle}>輸入三數與問題，我們將替你解卦</Text>
              </View>
              {!!result && (
                <View style={styles.heroBadge} testID="hero-bagua-badge" accessibilityLabel="本卦標籤">
                  <MaterialIcons name="local-offer" size={14} color="#fff" />
                  <Text style={styles.heroBadgeText}>{`${result.lowerTrigram}下 + ${result.upperTrigram}上`}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.card} testID="form-card">
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>輸入資訊</Text>
              {!paymentLoading && (
                <View style={styles.usageInfo}>
                  {canUseFree ? (
                    <Text style={styles.freeUsesText}>
                      免費次數：{paymentState.freeUsesRemaining}/10
                    </Text>
                  ) : (
                    <Text style={styles.needPayText}>需付費使用</Text>
                  )}
                </View>
              )}
            </View>
            <View style={styles.row3}>
              <DigitInput
                ref={n1Ref}
                label="數字一"
                value={form.n1}
                onChangeText={(v) => onChangeN("n1", v)}
                onBlur={() => onBlurPad("n1")}
                onSubmitEditing={() => n2Ref.current?.focus()}
                error={errors.n1}
                testID="input-n1"
                width={72}
              />
              <DigitInput
                ref={n2Ref}
                label="數字二"
                value={form.n2}
                onChangeText={(v) => onChangeN("n2", v)}
                onBlur={() => onBlurPad("n2")}
                onSubmitEditing={() => n3Ref.current?.focus()}
                error={errors.n2}
                testID="input-n2"
                width={72}
              />
              <DigitInput
                ref={n3Ref}
                label="數字三"
                value={form.n3}
                onChangeText={(v) => onChangeN("n3", v)}
                onBlur={() => onBlurPad("n3")}
                error={errors.n3}
                testID="input-n3"
                width={72}
              />
            </View>

            <View style={styles.mt12}>
              <TextArea
                label="你的問題"
                value={form.question}
                onChangeText={onChangeQuestion}
                placeholder="請在這裡輸入你的具體問題"
                error={errors.question}
                maxLength={500}
                testID="input-question"
              />
            </View>

            <Button
              title={mutation.isPending ? "解卦中..." : needsPayment ? `付費解卦 (NT${PAID_PRICE_TWD})` : "開始解卦"}
              onPress={submit}
              loading={mutation.isPending}
              disabled={mutation.isPending || paymentLoading}
              style={styles.submitBtn}
              testID="submit-button"
            />

            {mutation.isError && !result && (
              <View style={styles.errorBox} testID="error-box">
                <Text style={styles.errorTitle}>
                  {mutation.error instanceof Error ? mutation.error.message : "目前系統繁忙，請稍後再試"}
                </Text>
                <Button
                  title="重試"
                  onPress={submit}
                  variant="outline"
                  style={styles.retryBtn}
                  testID="retry-button"
                />
              </View>
            )}
          </View>

          {!!result && (
            <View style={styles.mt16}>
              <ResultCard data={result} />
              <Button
                title="再次占卜"
                onPress={resetForAgain}
                variant="outline"
                style={styles.againBtn}
                testID="again-button"
              />
            </View>
          )}

          <View style={styles.mt16}>
            <HistoryList items={history} />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
        <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
      </KeyboardAvoidingView>
      
      <PaymentModal
        visible={showPaymentModal}
        onClose={handleClosePaymentModal}
        onPaymentSuccess={handlePaymentSuccess}
        freeUsesRemaining={paymentState.freeUsesRemaining}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16, gap: 12 },
  hero: {
    backgroundColor: "#10B981",
    borderRadius: 16,
    padding: 16,
  },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroTexts: { flexShrink: 1, paddingRight: 12 },
  h1: { fontSize: 22, fontWeight: "800", color: "#fff" },
  subtitle: { color: "#ECFDF5", marginTop: 6 },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)" },
  heroBadgeText: { color: "#FFFFFF", fontWeight: "700" as const, fontSize: 12 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E5E7EB" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  usageInfo: { alignItems: "flex-end" },
  freeUsesText: { fontSize: 12, color: Colors.light.primary, fontWeight: "600" },
  unlimitedText: { fontSize: 12, color: Colors.light.primary, fontWeight: "600" },
  needPayText: { fontSize: 12, color: Colors.light.danger, fontWeight: "600" },
  row3: { flexDirection: "row", gap: 10, justifyContent: "space-between", alignItems: "flex-end", flexWrap: "nowrap" },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  submitBtn: { marginTop: 10 },
  errorBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorTitle: { color: Colors.light.danger, fontWeight: "600", marginBottom: 8 },
  retryBtn: { marginTop: 4 },
  againBtn: { marginTop: 10 },
});