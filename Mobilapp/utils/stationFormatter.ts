export function formatStationMultiline(name: string): {
  city: string;
  stop: string;
} {
  if (!name) return { city: "", stop: "" };

  const shortened = name
    .replace(/autóbusz-állomás/gi, "autóbusz-áll.")
    .replace(/autóbusz-váróterem/gi, "autóbusz-vt.")
    .replace(/vasútállomás/gi, "vá.")
    .replace(/vasúti megállóhely/gi, "vmh.")
    .replace(/pályaudvar/gi, "pu.")
    .replace(/váróterem/gi, "vt.");

  // ha van vessző
  if (shortened.includes(",")) {
    const parts = shortened.split(",");
    return {
      city: parts[0].trim(),
      stop: parts.slice(1).join(",").trim(),
    };
  }

  // ha nincs vessző
  const stopKeywords = ["vá.", "pu.", "vmh.", "autóbusz-áll.", "autóbusz-vt.", "vt."];

  const words = shortened.trim().split(" ");
  const lastWord = words[words.length - 1];

  if (stopKeywords.includes(lastWord)) {
    return {
      city: words.slice(0, -1).join(" "),
      stop: lastWord,
    };
  }

  // fallback
  return {
    city: shortened,
    stop: "",
  };
}