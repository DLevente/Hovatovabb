import React, { useEffect, useRef, useState } from "react";
import { View, TextInput, Text, Pressable, FlatList } from "react-native";
import type { Station } from "../models/types";
import { searchStation } from "../lib/menetrendApi";

export default function StationInput({
  label,
  value,
  onPick,
  placeholder,
}: {
  label: string;
  value: Station | null;
  onPick: (s: Station) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(value?.lsname ?? "");
  const [items, setItems] = useState<Station[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<any>(null);

  useEffect(() => {
    setText(value?.lsname ?? "");
  }, [value?.lsname]);

  function onChange(t: string) {
    setText(t);
    setOpen(true);

    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      if (t.trim().length < 2) {
        setItems([]);
        return;
      }
      try {
        setLoading(true);
        const res = await searchStation(t.trim());
        setItems(res);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: "#9fb4d8", marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={text}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#6b7fa6"
        style={{
          backgroundColor: "#111b2c",
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 12,
          color: "white",
          borderWidth: 1,
          borderColor: "#22324e",
        }}
      />

      {open && (items.length > 0 || loading) && (
        <View
          style={{
            backgroundColor: "#0f1729",
            borderRadius: 12,
            marginTop: 8,
            borderWidth: 1,
            borderColor: "#22324e",
            maxHeight: 220,
            overflow: "hidden",
          }}
        >
          {loading && (
            <Text style={{ color: "#9fb4d8", padding: 10 }}>Keresés…</Text>
          )}

          <FlatList
            data={items}
            keyExtractor={(it, idx) => `${it.ls_id}-${idx}`}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onPick(item);
                  setText(item.lsname);
                  setOpen(false);
                }}
                style={{ padding: 12 }}
              >
                <Text style={{ color: "white" }}>{item.lsname}</Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}