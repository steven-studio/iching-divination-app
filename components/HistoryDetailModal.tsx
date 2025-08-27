import Colors from "@/constants/colors";
import type { HistoryItem } from "@/types/history";
import { MaterialIcons } from '@expo/vector-icons';
import { memo } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  item: HistoryItem | null;
  onClose: () => void;
};

export const HistoryDetailModal = memo(function HistoryDetailModal({ visible, item, onClose }: Props) {
  if (!item) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>占卜詳情</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed ? { opacity: 0.7 } : undefined]}
            testID="close-history-detail"
          >
            <MaterialIcons name="close" size={24} color={Colors.light.text} />
          </Pressable>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>占卜資訊</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>時間</Text>
              <Text style={styles.value}>{formatTime(item.timestamp)}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>數字</Text>
              <Text style={styles.value}>
                {String(item.n1).padStart(3, "0")}-{String(item.n2).padStart(3, "0")}-{String(item.n3).padStart(3, "0")}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>問題</Text>
              <Text style={[styles.value, styles.questionText]}>{item.question}</Text>
            </View>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>解卦結果</Text>
            
            <View style={styles.resultRow}>
              <View style={styles.tagRow}>
                <MaterialIcons name="local-offer" size={16} color={Colors.light.primary} />
                <Text style={styles.tagText}>本卦</Text>
              </View>
              <Text style={styles.resultValue}>
                {item.lowerTrigram} 下 + {item.upperTrigram} 上 · {item.hexagramName}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <View style={styles.tagRow}>
                <MaterialIcons name="local-offer" size={16} color={Colors.light.primary} />
                <Text style={styles.tagText}>變爻</Text>
              </View>
              <Text style={styles.resultValue}>第 {item.changingLine} 爻</Text>
            </View>

            <View style={styles.separator} />

            <Text style={styles.subtitle}>朱熹解卦</Text>
            <Text style={styles.explanation}>{item.explanation.plain}</Text>

            {Array.isArray(item.explanation.tips) && item.explanation.tips.length > 0 && (
              <>
                <Text style={styles.subtitle}>建議</Text>
                <View style={styles.tips}>
                  {item.explanation.tips.map((tip, idx) => (
                    <View key={String(idx)} style={styles.tipItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
});

function formatTime(ts: number): string {
  try {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(
      d.getHours(),
    ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: Colors.light.text,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.muted,
    width: 60,
    marginRight: 12,
  },
  value: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  questionText: {
    lineHeight: 20,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tagText: {
    color: Colors.light.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
    flex: 1,
    textAlign: "right",
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 8,
    color: Colors.light.text,
  },
  explanation: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
  },
  tips: {
    marginTop: 4,
    gap: 8,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
});