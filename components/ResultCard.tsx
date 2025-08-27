import Colors from "@/constants/colors";
import type { DivinationResponse } from "@/utils/api";
import { MaterialIcons } from '@expo/vector-icons';
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  data: DivinationResponse;
};

export const ResultCard = memo(function ResultCard({ data }: Props) {
  return (
    <View style={styles.card} testID="result-card">
      <Text style={styles.title}>解卦結果</Text>
      <View style={styles.row}>
        <View style={styles.tagRow}>
          <MaterialIcons name="local-offer" size={16} color={Colors.light.primary} />
          <Text style={styles.tagText}>本卦</Text>
        </View>
        <Text style={styles.value}>
          {data.lowerTrigram} 下 + {data.upperTrigram} 上 · {data.hexagramName}
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.tagRow}>
          <MaterialIcons name="local-offer" size={16} color={Colors.light.primary} />
          <Text style={styles.tagText}>變爻</Text>
        </View>
        <Text style={styles.value}>第 {data.changingLine} 爻</Text>
      </View>

      <View style={styles.separator} />

      <Text style={styles.subtitle}>朱熹解卦</Text>
      <Text style={styles.paragraph}>{data.explanation.plain}</Text>

      {Array.isArray(data.explanation.tips) && data.explanation.tips.length > 0 && (
        <>
          <Text style={styles.subtitle}>建議</Text>
          <View style={styles.tips}>
            {data.explanation.tips.map((tip, idx) => (
              <View key={String(idx)} style={styles.tipItem}>
                <View style={styles.bullet} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 16, fontWeight: "600", marginTop: 6 },
  paragraph: { fontSize: 15, lineHeight: 22, color: "#111827" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tagText: { color: Colors.light.primary, fontWeight: "600" },
  value: { fontSize: 15, fontWeight: "500" },
  separator: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 8 },
  tips: { marginTop: 4, gap: 8 },
  tipItem: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.light.primary, marginTop: 7 },
  tipText: { flex: 1, fontSize: 15, color: "#111827" },
});