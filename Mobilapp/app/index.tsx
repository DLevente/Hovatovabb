import React, { useMemo, useState } from "react";
import { View, Text, Pressable, FlatList, Image, Linking } from "react-native";

import type { Station, Journey } from "../models/types";
import StationInput from "../components/StationInput";
import JourneyCard from "../components/JourneyCard";
import LoadingOverlay from "../components/LoadingOverlay";
import { runDescription, searchRoutesCustom } from "../lib/menetrendApi";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import JourneyInfoModal from "../components/JourneyInfoModal";
import { Icons } from "@/src/ui/icons";

export default function Index() {
    const [from, setFrom] = useState<Station | null>(null);
    const [to, setTo] = useState<Station | null>(null);

    const swapStations = () => {
        setFrom(to);
        setTo(from);
    };

    const [date, setDate] = useState(() => new Date());      // végleges dátum
    const [hour, setHour] = useState(() => new Date().getHours());
    const [minute, setMinute] = useState(() => new Date().getMinutes());
    const dateStr = date.toISOString().split("T")[0];

    const [showDate, setShowDate] = useState(false);
    const [showTime, setShowTime] = useState(false);

    // draft (amit a picker tekerget)
    const [draftDate, setDraftDate] = useState<Date>(() => new Date());
    const [draftHour, setDraftHour] = useState<number>(() => new Date().getHours());
    const [draftMinute, setDraftMinute] = useState<number>(() => new Date().getMinutes());

    const [journeys, setJourneys] = useState<Journey[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const draftTimeAsDate = new Date();

    const [infoJourney, setInfoJourney] = React.useState<any | null>(null);
    const [infoLoading, setInfoLoading] = React.useState(false);
    const [infoStops, setInfoStops] = React.useState<any[]>([]);

    const onInfo = async (j: any) => {
        setInfoJourney(j);
        setInfoStops([]);
        setInfoLoading(true);

        try {
            // itt azt hívd, amit angularban is: runDescription endpoint
            // példa: nativeData[0] szegmensből:
            const seg = j?.nativeData?.[0];

            const stopsObj = await runDescription({
                runId: seg.RunId,
                slsId: seg.DepartureStation,
                elsId: seg.ArrivalStation,
                date: dateStr,
            });

            // stopsObj: { "1": {...}, "2": {...} } -> tömbbé
            const stopsArr = Object.values(stopsObj || {});
            setInfoStops(stopsArr);
        } finally {
            setInfoLoading(false);
        }
    };
    draftTimeAsDate.setHours(draftHour);
    draftTimeAsDate.setMinutes(draftMinute);
    draftTimeAsDate.setSeconds(0);
    draftTimeAsDate.setMilliseconds(0);

    async function onSearch() {
        try {
            setError("");
            setJourneys([]);

            if (!from || !to) {
                setError("Válassz indulási és érkezési állomást!");
                return;
            }

            setLoading(true);
            const res = await searchRoutesCustom(from, to, dateStr, hour, minute);
            setJourneys(res);
            if (res.length === 0) setError("Nincs találat.");
            setLoading(false);
        }
        catch (e: any) {
            setError("Nincs találat.");
            setJourneys([]);
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: "#0b1220" }}>
            <JourneyInfoModal
                visible={!!infoJourney}
                journey={infoJourney}
                date={dateStr}
                onClose={() => setInfoJourney(null)}
            />
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                {/* BAL OLDAL: LOGÓ + CÍM */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Image
                        source={require("../assets/images/icon.png")}
                        style={{ width: 26, height: 26 }}
                        resizeMode="contain"
                    />
                    <Text style={{ color: "white", fontSize: 22, fontWeight: "800" }}>
                        HovaTovább
                    </Text>
                    <Text style={{ color: "white", fontSize: 20 }}>Lite</Text>
                </View>

                {/* JOBB OLDAL: GITHUB */}
                <Pressable
                    onPress={() => Linking.openURL("https://github.com/BenjaminStonawski/hovatovabb")}
                    hitSlop={10}
                >
                    <Icons.github width={22} height={22} fill="white" style={{ marginBottom: 2 }} />
                </Pressable>
            </View>

            <View style={{ marginTop: 14 }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                        <StationInput
                            label="Indulás"
                            value={from}
                            onPick={setFrom}
                            placeholder="Honnan..."
                        />
                    </View>

                    <Pressable
                        onPress={swapStations}
                        style={{
                            width: 44,
                            height: 40,
                            borderRadius: 14,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#111b2c",
                            borderWidth: 1,
                            borderColor: "#22324e",
                            marginTop: 20,
                        }}
                        hitSlop={10}
                    >
                        <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>↔</Text>
                    </Pressable>

                    <View style={{ flex: 1 }}>
                        <StationInput
                            label="Érkezés"
                            value={to}
                            onPick={setTo}
                            placeholder="Hová..."
                        />
                    </View>
                </View>

                <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                    {/* DÁTUM */}
                    <Pressable
                        onPress={() => {
                            setShowTime(false);
                            setDraftDate(new Date(date));
                            setShowDate(v => !v);
                        }}
                        style={{
                            flex: 1,
                            backgroundColor: "#111b2c",
                            padding: 12,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: "#22324e",
                        }}
                    >
                        <Text style={{ color: "#9fb4d8", fontSize: 12 }}>Dátum</Text>
                        <Text style={{ color: "white" }}>{dateStr}</Text>
                    </Pressable>

                    {/* IDŐ */}
                    <Pressable
                        onPress={() => {
                            setShowDate(false);
                            setDraftHour(hour);
                            setDraftMinute(minute);
                            setShowTime(v => !v);
                        }}
                        style={{
                            width: 120,
                            backgroundColor: "#111b2c",
                            padding: 12,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: "#22324e",
                        }}
                    >
                        <Text style={{ color: "#9fb4d8", fontSize: 12 }}>Idő</Text>
                        <Text style={{ color: "white" }}>
                            {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
                        </Text>
                    </Pressable>
                </View>

                {showDate && (
                    <View style={{ marginBottom: 12 }}>
                        <DateTimePicker
                            value={draftDate}
                            mode="date"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            onChange={(event, selected) => {
                                if (selected) setDraftDate(selected);
                            }}
                        />

                        <Pressable
                            onPress={() => {
                                setDate(draftDate);
                                setShowDate(false);
                            }}
                            style={{
                                marginTop: 10,
                                backgroundColor: "#2563eb",
                                paddingVertical: 10,
                                borderRadius: 12,
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ color: "white", fontWeight: "700" }}>Mentés</Text>
                        </Pressable>
                    </View>
                )}

                {showTime && (
                    <View style={{ marginBottom: 12 }}>
                        <DateTimePicker
                            value={draftTimeAsDate}
                            mode="time"
                            is24Hour={true}
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            onChange={(event, selected) => {
                                if (!selected) return;
                                setDraftHour(selected.getHours());
                                setDraftMinute(selected.getMinutes());
                            }}
                        />

                        <Pressable
                            onPress={() => {
                                setHour(draftHour);
                                setMinute(draftMinute);
                                setShowTime(false);
                            }}
                            style={{
                                marginTop: 10,
                                backgroundColor: "#2563eb",
                                paddingVertical: 10,
                                borderRadius: 12,
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ color: "white", fontWeight: "700" }}>Mentés</Text>
                        </Pressable>
                    </View>
                )}

                <Pressable
                    onPress={onSearch}
                    style={{
                        backgroundColor: "#075e5d",
                        paddingVertical: 12,
                        borderRadius: 12,
                        alignItems: "center",
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Icons.search width={14} height={14} />
                        <Text style={{ color: "white", fontSize: 14, fontWeight: "700" }}>
                            Keresés
                        </Text>
                    </View>
                </Pressable>

                {!!error && (
                    <Text style={{ color: "#d1d1d1", marginTop: 12 }}>{error}</Text>
                )}
            </View>

            <View style={{ marginTop: 16, flex: 1 }}>
                <FlatList
                    data={journeys}
                    keyExtractor={(_, idx) => String(idx)}
                    // nincs találat vagy találatok journeycard
                    renderItem={({ item }) => item?.nativeData?.length > 0 ? (
                        <JourneyCard
                            journey={item}
                            onInfo={onInfo}
                        />
                    ) : null}
                    ListEmptyComponent={
                        !loading && !error ? (
                            <Text style={{ color: "#9fb4d8", marginTop: 10 }}>
                            </Text>
                        ) : null
                    }
                />
            </View>

            {loading && <LoadingOverlay text="Keresés..." />}
        </View>
    );
}