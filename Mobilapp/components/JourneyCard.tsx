import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import TransportChip from "./TransportChip";
import { Icons } from "../src/ui/icons";
import { formatStationMultiline } from "../utils/stationFormatter";
import { iconKeyForMode } from "../src/ui/transport";

type Journey = {
  nativeData: any[];
  osszido?: string;
  duration?: string;
  realDeparture?: string;
  realArrival?: string;
  departureDelayed?: boolean;
  arrivalDelayed?: boolean;
  delayMinutes?: number;
  indulasi_hely?: string;
  erkezesi_hely?: string;
};

type Props = {
  journey: Journey;
  onInfo?: (j: Journey, segmentIndex?: number) => void;
};

function timeFromMinutes(t: any): string {
  const n = Number(t);
  if (!Number.isFinite(n)) return "--:--";
  const h = Math.floor(n / 60) % 24;
  const m = n % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function hhmmFromDeltaMinutes(delta: number): string {
  const mins = Math.max(0, Math.floor(delta));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function segDuration(seg: any): string {
  const dep = Number(seg?.DepartureTime);
  const arr = Number(seg?.ArrivalTime);
  if (!Number.isFinite(dep) || !Number.isFinite(arr)) return "—";
  const delta = arr - dep;
  if (!Number.isFinite(delta) || delta < 0) return "—";
  return hhmmFromDeltaMinutes(delta);
}

export default function JourneyCard({ journey, onInfo }: Props) {
  const InfoIcon = Icons.info;

  const first = journey.nativeData?.[0];
  const last = journey.nativeData?.[journey.nativeData.length - 1];

  const transfers = Math.max(0, (journey.nativeData?.length ?? 1) - 1);
  const [expanded, setExpanded] = useState(false);

  const depText = journey.realDeparture ?? timeFromMinutes(first?.DepartureTime);
  const arrText = journey.realArrival ?? timeFromMinutes(last?.ArrivalTime);

  const depColor = journey.departureDelayed ? "#f87171" : "white";
  const arrColor = journey.arrivalDelayed ? "#f87171" : "white";

  const duration = journey.osszido ?? journey.duration ?? "—";

  const formattedDep = formatStationMultiline(first?.DepStationName ?? journey?.indulasi_hely ?? "");
  const formattedArr = formatStationMultiline(last?.ArrStationName ?? journey?.erkezesi_hely ?? "");

  const segments = journey.nativeData ?? [];
  const showSegments = transfers > 0 && expanded;

  const chevron = useMemo(() => (expanded ? "▲" : "▼"), [expanded]);

  function segLabel(seg: any) {
    return String(seg?.DomainCode ?? seg?.LocalDomainCode ?? seg?.JourneyName ?? "").trim();
  }

  function SegIconFor(seg: any) {
    const mode = String(seg?.TransportMode ?? seg?.Mode ?? "");
    const key = iconKeyForMode(mode);
    return Icons[key] ?? Icons.bus;
  }

  return (
    <View style={styles.card}>
      {/* header */}
      <View style={styles.headerRow}>
        <TransportChip
          nativeData={journey.nativeData}
          label={transfers === 0 ? (first?.JourneyName || first?.LocalDomainCode || "") : ""}
          ownerLabel={transfers === 0 ? journey.nativeData?.[0]?.OwnerName : undefined}
        />

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={styles.infoBtn}
          onPress={() => onInfo?.(journey, 0)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <InfoIcon width={18} height={18} />
        </TouchableOpacity>
      </View>

      {/* transfers line */}
      {transfers > 0 && (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.transferLine}
          onPress={() => setExpanded((v) => !v)}
        >
          <Text style={styles.transferText}>Átszállás: {transfers}</Text>
          <Text style={styles.chev}>{chevron}</Text>
        </TouchableOpacity>
      )}

      {/* main row */}
      <View style={styles.routeRow}>
        <View style={styles.block}>
          <Text style={styles.label}>Indulás</Text>
          <Text style={[styles.time, { color: depColor }]}>{depText}</Text>

          <View style={styles.stationRow}>
            <Icons.pin width={14} height={14} />
            <View style={styles.columnFlex}>
              <Text style={styles.cityText}>{formattedDep.city}</Text>
              {formattedDep.stop !== "" && <Text style={styles.stopText}>{formattedDep.stop}</Text>}
            </View>
          </View>
        </View>

        <View style={styles.mid}>
          <Icons.clock width={18} height={18} />
          <Text style={styles.duration}>{duration}</Text>

          {typeof journey.delayMinutes === "number" && journey.delayMinutes !== 0 && (
            <Text style={styles.delayText}>Késés: {Math.abs(journey.delayMinutes)} perc</Text>
          )}
        </View>

        <View style={[styles.block, { alignItems: "flex-end" }]}>
          <Text style={styles.label}>Érkezés</Text>
          <Text style={[styles.time, { color: arrColor }]}>{arrText}</Text>

          <View style={styles.stationRow}>
            <Icons.pin width={14} height={14} />
            <View style={[styles.columnFlex, { alignItems: "flex-end" }]}>
              <Text style={styles.cityText}>{formattedArr.city}</Text>
              {formattedArr.stop !== "" && (
                <Text style={[styles.stopText, { textAlign: "right" }]}>{formattedArr.stop}</Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* segments */}
      {showSegments && (
        <View style={styles.segmentsWrap}>
          {segments.map((seg, idx) => {
            const dep = formatStationMultiline(String(seg?.DepStationName ?? ""));
            const arr = formatStationMultiline(String(seg?.ArrStationName ?? ""));
            const label = segLabel(seg);
            const SegIcon = SegIconFor(seg);

            return (
              <View key={idx} style={styles.segmentCard}>
                <View style={styles.segmentHead}>
                  <Text style={styles.segmentTitle}>{idx + 1}. szakasz</Text>

                  <View style={styles.segmentRight}>
                    <View style={styles.lineWrap}>
                      <SegIcon width={16} height={16} />
                      <Text style={styles.segmentLine}>{label || "—"}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.segmentBody}>
                  <View style={styles.segBlock}>
                    <Text style={styles.segLabel}>Indulás</Text>
                    <Text style={styles.segTime}>{timeFromMinutes(seg?.DepartureTime)}</Text>

                    <View style={styles.stationRow}>
                      <Icons.pin width={14} height={14} />
                      <View style={styles.columnFlex}>
                        <Text style={styles.cityText}>{dep.city}</Text>
                        {dep.stop ? <Text style={styles.stopText}>{dep.stop}</Text> : null}
                      </View>
                    </View>
                  </View>

                  <View style={styles.segMid}>
                    <Icons.clock width={16} height={16} />
                    <Text style={styles.segDur}>{segDuration(seg)}</Text>
                  </View>

                  <View style={[styles.segBlock, { alignItems: "flex-end" }]}>
                    <Text style={styles.segLabel}>Érkezés</Text>
                    <Text style={styles.segTime}>{timeFromMinutes(seg?.ArrivalTime)}</Text>

                    <View style={styles.stationRow}>
                      <Icons.pin width={14} height={14} />
                      <View style={[styles.columnFlex, { alignItems: "flex-end" }]}>
                        <Text style={styles.cityText}>{arr.city}</Text>
                        {arr.stop ? (
                          <Text style={[styles.stopText, { textAlign: "right" }]}>{arr.stop}</Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </View>

                {idx < segments.length - 1 && <View style={styles.dashed} />}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#22324e",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 14,
  },

  headerRow: { flexDirection: "row", alignItems: "center" },
  infoBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111b2c",
    borderWidth: 1,
    borderColor: "#22324e",
  },

  transferLine: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start" },
  transferText: { color: "#9fb4d8", fontWeight: "700" },
  chev: { color: "#9fb4d8", fontWeight: "900", marginLeft: 6 },

  routeRow: { flexDirection: "row", justifyContent: "space-between" },
  block: { flex: 1, gap: 6 },
  label: { color: "#9fb4d8", fontSize: 12 },
  time: { fontSize: 22, fontWeight: "900" },

  stationRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  columnFlex: { flexDirection: "column" },

  cityText: { color: "white", fontWeight: "600" },
  stopText: { color: "#9fb4d8", fontSize: 13 },

  mid: { width: 90, alignItems: "center", justifyContent: "center", gap: 6 },
  duration: { color: "#9fb4d8", fontWeight: "700" },
  delayText: { color: "#f87171", fontWeight: "800", fontSize: 12, textAlign: "center" },

  segmentsWrap: {
    backgroundColor: "#0b1323",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  segmentCard: {
    backgroundColor: "#0a1220",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 12,
  },
  segmentHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  segmentTitle: { color: "rgba(255,255,255,0.65)", fontWeight: "700" },

  segmentRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  lineWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  segmentLine: { color: "white", fontWeight: "800" },

  segInfoBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111b2c",
    borderWidth: 1,
    borderColor: "#22324e",
  },

  segmentBody: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  segBlock: { flex: 1, gap: 6 },
  segLabel: { color: "#9fb4d8", fontSize: 12 },
  segTime: { color: "white", fontSize: 20, fontWeight: "900" },

  segMid: { width: 80, alignItems: "center", justifyContent: "center", gap: 6 },
  segDur: { color: "#9fb4d8", fontWeight: "700", textAlign: "center" },

  dashed: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.22)",
    borderStyle: "dashed",
  },
});