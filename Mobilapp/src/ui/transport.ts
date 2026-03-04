export function iconKeyForMode(mode?: string): "bus" | "train" | "tram" | "metro" {
  const m = String(mode ?? "").toLowerCase();
  if (m.includes("tram")) return "tram";
  if (m.includes("metro")) return "metro";
  if (m.includes("train") || m.includes("localtrain") || m.includes("rail")) return "train";
  return "bus";
}

export function ownerColor(owner?: string): string {
  const o = String(owner ?? "").toUpperCase();
  if (o.startsWith("BKK")) return "#4c0E5f";
  if (o.startsWith("VOLÁN") || o.includes("VOLAN")) return "#995400";
  if (o.startsWith("MÁV") || o.includes("MAV")) return "#1e40af";
  return "#00520a"; // default
}

// Unique színek a journey szegmensek tulajdonosai alapján (átszállásnál)
export function gradientColorsFromSegments(nativeData: any[]): string[] {
  const colors = (nativeData ?? [])
    .map((s) => ownerColor(s?.OwnerName))
    .filter(Boolean);

  const unique = Array.from(new Set(colors));
  if (unique.length === 0) return ["#1e40af", "#1e40af"];
  if (unique.length === 1) return [unique[0], unique[0]];
  return unique.slice(0, 4); // ne legyen túl sok
}