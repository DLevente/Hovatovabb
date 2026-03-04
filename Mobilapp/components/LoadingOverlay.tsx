import React from "react";
import { View, ActivityIndicator, Text } from "react-native";

export default function LoadingOverlay({ text }: { text?: string }) {
  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <ActivityIndicator size="large" />
      {!!text && <Text style={{ color: "white", marginTop: 10 }}>{text}</Text>}
    </View>
  );
}