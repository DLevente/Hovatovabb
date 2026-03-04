import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import type { Journey } from "../models/types";
import { runDescription, type RunDescriptionStop } from "../lib/menetrendApi";

import { Icons } from "../src/ui/icons";
import { iconKeyForMode } from "../src/ui/transport";

type Props = {
    visible: boolean;
    onClose: () => void;
    journey: Journey | null;
    date: string; // YYYY-MM-DD
};

function hhmm(v?: string) {
    const s = String(v ?? "").trim();
    if (!s || s === "n.a." || s === "n.a") return "";
    if (s.includes("T")) return s.split("T")[1]?.slice(0, 5) ?? "";
    if (s.length >= 5) return s.slice(0, 5);
    return s;
}

function cleanTime(v: any): string {
    const s = String(v ?? "").trim();
    if (!s) return "";
    const low = s.toLowerCase();
    if (low === "n.a." || low === "n.a" || low === "na") return "";
    return s;
}

function pickPlannedOrExpected(expected: any, scheduled: any) {
    const e = cleanTime(expected);
    const s = cleanTime(scheduled);
    return e || s;
}

type SegKey = string; // runId|slsId|elsId|date

export default function JourneyInfoModal({ visible, onClose, journey, date }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // szakasz választás
    const [segIndex, setSegIndex] = useState(0);

    // cache: szakaszonként tároljuk a megállólistát
    const cacheRef = useRef<Record<SegKey, RunDescriptionStop[]>>({});
    const [stops, setStops] = useState<RunDescriptionStop[]>([]);

    // szegmensek
    const segments = useMemo(() => journey?.nativeData ?? [], [journey]);

    // ha új journey nyílik meg, vissza az első szakaszra + ürítjük a view-t (cache maradhat)
    useEffect(() => {
        if (visible) {
            setSegIndex(0);
            setStops([]);
            setError("");
        }
    }, [visible, journey]);

    const activeSeg = segments?.[segIndex];

    const runId = Number(activeSeg?.RunId ?? 0);
    const slsId = Number(activeSeg?.DepartureStation ?? 0);
    const elsId = Number(activeSeg?.ArrivalStation ?? 0);

    // title: csak DomainCode (fallback)
    const titleLine = useMemo(() => {
        const domain = String(
            activeSeg?.DomainCode ??
            activeSeg?.LocalDomainCode ??
            activeSeg?.JourneyName ??
            ""
        ).trim();

        return domain || "Járat";
    }, [activeSeg]);

    const VehicleIcon = useMemo(() => {
        const mode = String(activeSeg?.TransportMode ?? activeSeg?.Mode ?? "");
        const key = iconKeyForMode(mode);
        return Icons[key] ?? Icons.bus;
    }, [activeSeg]);

    function segLabel(seg: any, idx: number) {
        const domain = String(
            seg?.DomainCode ?? seg?.LocalDomainCode ?? seg?.JourneyName ?? ""
        ).trim();
        return {
            idxText: `#${idx + 1}`,
            lineText: domain || "—",
            mode: String(seg?.TransportMode ?? seg?.Mode ?? ""),
        };
    }

    // betöltés: mindig az AKTÍV szakaszhoz
    useEffect(() => {
        let mounted = true;

        async function load() {
            if (!visible) return;
            if (!journey) return;

            setError("");
            setStops([]);

            if (!runId || !slsId || !elsId || !date) {
                setError("Nincs elég adat a részletek betöltéséhez.");
                return;
            }

            const key: SegKey = `${runId}|${slsId}|${elsId}|${date}`;

            // cache hit
            const cached = cacheRef.current[key];
            if (cached) {
                setStops(cached);
                return;
            }

            setLoading(true);
            try {
                const list = await runDescription({ runId, slsId, elsId, date });
                if (!mounted) return;

                const safeList = Array.isArray(list) ? list : [];
                cacheRef.current[key] = safeList;
                setStops(safeList);
            } catch (e: any) {
                if (!mounted) return;
                setError(e?.message ?? "Hiba történt");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();
        return () => {
            mounted = false;
        };
    }, [visible, journey, runId, slsId, elsId, date, segIndex]);

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose} />

            <View style={styles.sheet}>
                {/* HEADER */}
                <View style={styles.top}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>Járat részletei</Text>
                        <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                            <Text style={styles.closeX}>✕</Text>
                        </Pressable>
                    </View>

                    <View style={styles.divider} />

                    {/* SZAKASZ VÁLASZTÓ (ha több van) */}
                    {segments.length > 1 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.segBar}
                        >
                            {segments.map((seg, idx) => {
                                const selected = idx === segIndex;
                                const { idxText, lineText, mode } = segLabel(seg, idx);

                                const Icon = Icons[iconKeyForMode(mode)] ?? Icons.bus;

                                return (
                                    <Pressable
                                        key={idx}
                                        onPress={() => setSegIndex(idx)}
                                        style={[
                                            styles.segBtn,
                                            selected ? styles.segBtnSelected : styles.segBtnIdle,
                                        ]}
                                    >
                                        <Icon width={16} height={16} />

                                        <Text style={styles.segIdx}>{idxText}</Text>
                                        <Text style={styles.segLine} numberOfLines={1}>
                                            {lineText}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    )}

                    {/* LINE CARD */}
                    <View style={styles.headerCard}>
                        <View style={styles.headerLeft}>
                            <VehicleIcon width={22} height={22} />
                            <Text style={styles.lineNumber}>{titleLine}</Text>
                        </View>
                    </View>
                </View>


                {/* TABLE HEAD */}
                <View style={styles.tableHead}>
                    <Text style={[styles.th, { flex: 1 }]}>Megálló</Text>
                    <Text style={[styles.th, { width: 84, textAlign: "right" }]}>Érkezik</Text>
                    <Text style={[styles.th, { width: 84, textAlign: "right" }]}>Indul</Text>
                </View>

                {loading && (
                    <View style={styles.center}>
                        <ActivityIndicator />
                        <Text style={styles.muted}>Betöltés...</Text>
                    </View>
                )}

                {!!error && !loading && <Text style={styles.error}>{error}</Text>}

                {!loading && !error && stops.length === 0 && (
                    <Text style={styles.muted}>Nincs elérhető részletes megállólista.</Text>
                )}

                {/* TABLE BODY */}
                {!loading && stops.length > 0 && (
                    <ScrollView style={styles.table} contentContainerStyle={{ paddingBottom: 18 }}>
                        {stops.map((s, idx) => {
                            const arr = hhmm(pickPlannedOrExpected(s.varhato_erkezik, s.erkezik));
                            const dep = hhmm(pickPlannedOrExpected(s.varhato_indul, s.indul));

                            return (
                                <View key={idx} style={styles.row}>
                                    <Text style={styles.stop} numberOfLines={2}>
                                        {s.megallo}
                                    </Text>

                                    <Text style={[styles.time, !arr && styles.timeMuted]}>{arr || "-"}</Text>
                                    <Text style={[styles.time, !dep && styles.timeMuted]}>{dep || "-"}</Text>
                                </View>
                            );
                        })}
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
    },

    top: {
        flexShrink: 0,
    },

    sheet: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 50,
        bottom: 0,
        backgroundColor: "#0b1323",
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        paddingTop: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
    },

    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
        paddingBottom: 12,
    },
    title: {
        color: "white",
        fontSize: 26,
        fontWeight: "700",
        letterSpacing: 0.2,
    },
    closeBtn: {
        width: 42,
        height: 42,
        alignItems: "center",
        justifyContent: "center",
    },
    closeX: { color: "white", fontSize: 22, fontWeight: "700" },

    divider: {
        height: 1,
        backgroundColor: "rgba(255,255,255,0.12)",
        marginHorizontal: 18,
        marginBottom: 14,
    },

    // --- SZAKASZ VÁLASZTÓ ---
    segBar: {
        paddingHorizontal: 18,
        paddingBottom: 10,
        gap: 10,
    },
    segBtn: {
        height: 32,                 // ✅ fix magasság => nem nő váltáskor
        borderRadius: 999,
        paddingHorizontal: 14,      // ✅ fix padding
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minWidth: 115,              // ✅ fix minimum szélesség => nem ugrál
        borderWidth: 1,
    },
    segBtnIdle: {
        backgroundColor: "rgba(255,255,255,0.06)",
        borderColor: "rgba(255,255,255,0.10)",
    },
    segBtnSelected: {
        backgroundColor: "rgba(37,99,235,0.20)",
        borderColor: "rgba(37,99,235,0.85)",
    },
    segIdx: {
        color: "rgba(255,255,255,0.65)", // ✅ szürkébb "#1"
        fontSize: 13,
        fontWeight: "700",
    },
    segLine: {
        color: "white",             // ✅ mindig látszik
        fontSize: 15,
        fontWeight: "700",
        flexShrink: 1,
    },

    // --- HEADER CARD ---
    headerCard: {
        marginHorizontal: 18,
        borderRadius: 16,
        backgroundColor: "#0f1b31",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 10,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    lineNumber: {
        color: "white",
        fontSize: 22,
        fontWeight: "700",
        letterSpacing: 0.2,
    },

    // --- TABLE ---
    tableHead: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingTop: 8,
        paddingBottom: 10,
    },
    th: {
        color: "rgba(255,255,255,0.75)",
        fontSize: 14,
        fontWeight: "600",
    },

    table: {
        marginTop: 4,
    },

    row: {
        flexDirection: "row",
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.10)",
        alignItems: "center",
    },
    stop: {
        flex: 1,
        color: "white",
        fontSize: 17,
        fontWeight: "500",
        paddingRight: 10,
    },
    time: {
        width: 84,
        textAlign: "right",
        color: "white",
        fontSize: 17,
        fontWeight: "600",
    },
    timeMuted: {
        color: "rgba(255,255,255,0.55)",
    },

    muted: {
        color: "rgba(255,255,255,0.65)",
        marginTop: 10,
        paddingHorizontal: 18,
    },
    error: { color: "#f87171", marginTop: 10, paddingHorizontal: 18 },
    center: { paddingVertical: 18, alignItems: "center", gap: 8 },
});