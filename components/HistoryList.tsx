import Colors from "@/constants/colors";
import type { HistoryItem } from "@/types/history";
import { MaterialIcons } from '@expo/vector-icons';
import { memo, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  items: HistoryItem[];
};

export const HistoryList = memo(function HistoryList({ items }: Props) {
  const [open, setOpen] = useState<boolean>(true);
  const sorted = useMemo(() => [...items].sort((a, b) => b.timestamp - a.timestamp), [items]);

  return (
    <View style={styles.container} testID="history-section">
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [styles.header, pressed ? { opacity: 0.8 } : undefined]}
        testID="history-toggle"
      >
        <View style={styles.headerLeft}>
          <MaterialIcons name="access-time" size={16} color={Colors.light.muted} />
          <Text style={styles.headerTitle}>最近 5 次占卜</Text>
        </View>
        {open ? <MaterialIcons name="keyboard-arrow-up" size={16} color={Colors.light.muted} /> : <MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.light.muted} />}
      </Pressable>

      {open && (
        <View style={styles.list} testID="history-list">
          {sorted.length === 0 ? (
            <Text style={styles.empty}>尚無紀錄</Text>
          ) : (
            sorted.map((h) => (
              <View key={String(h.timestamp)} style={styles.item}>
                <Text style={styles.itemTime}>{formatTime(h.timestamp)}</Text>
                <Text style={styles.itemNums}>
                  {String(h.n1).padStart(3, "0")}-{String(h.n2).padStart(3, "0")}-{String(h.n3).padStart(3, "0")}
                </Text>
                <Text style={styles.itemHex}>{h.hexagramName}</Text>
                <Text style={styles.itemLine}>第 {h.changingLine} 爻</Text>
              </View>
            ))
          )}
        </View>
      )}
    </View>
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
  container: { marginTop: 16, backgroundColor: "#fff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { color: Colors.light.muted, fontWeight: "600" },
  list: { marginTop: 8, gap: 8 },
  empty: { color: Colors.light.muted, fontSize: 13 },
  item: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  itemTime: { color: Colors.light.muted, width: 130 },
  itemNums: { fontWeight: "600", width: 110 },
  itemHex: { flexShrink: 1, flexGrow: 1 },
  itemLine: { color: Colors.light.muted },
});