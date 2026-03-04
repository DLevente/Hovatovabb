import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Icons } from "../src/ui/icons";
import { iconKeyForMode, gradientColorsFromSegments } from "../src/ui/transport";

type SegmentLike = {
  TransportMode?: string;
  Mode?: string;
  OwnerName?: string;
};

type Props = {
  nativeData: SegmentLike[];
  label?: string;          // pl. "4326"
  ownerLabel?: string;     // pl. "VOLÁN"
  showLabel?: boolean;
};

export default function TransportChip({
  nativeData,
  label,
  ownerLabel,
  showLabel = true,
}: Props) {
  const c = gradientColorsFromSegments(nativeData);

  // LinearGradient props típus miatt: legalább 2 elemű tuple kell
  const colors: [string, string, ...string[]] =
    c.length >= 2
      ? (c as [string, string, ...string[]])
      : ([c[0] ?? "#1e40af", c[0] ?? "#1e40af"] as [string, string]);

  // unique mode-ok ikonhoz
  const modes = Array.from(
    new Set((nativeData ?? []).map((s) => s?.TransportMode ?? s?.Mode ?? "").filter(Boolean))
  );

  const ChipInner = (
    <>
      <View style={styles.iconRow}>
        {modes.map((m, idx) => {
          const key = iconKeyForMode(m);
          const Icon = Icons[key];
          return <Icon key={idx} width={16} height={16} />;
        })}
      </View>

      {showLabel && !!label && <Text style={styles.label}>{label}</Text>}
    </>
  );

  return (
    <View style={styles.row}>
      {/* Járatszám / viszonylat chip (gradientes) */}
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.chip}>
        {ChipInner}
      </LinearGradient>

      {/* Szolgáltató chip (fix szürke) */}
      {!!ownerLabel && (
        <View style={styles.ownerChip}>
          <Text style={styles.ownerText}>{ownerLabel}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  chip: {
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  label: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
  },

  ownerChip: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#334155",
  },

  ownerText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
});