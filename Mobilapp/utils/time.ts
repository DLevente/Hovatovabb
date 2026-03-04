export function minutesToHHMM(totalMinutes: number): string {
  if (totalMinutes == null || isNaN(totalMinutes)) return "--";
  let h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h >= 24) h = h - 24;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}