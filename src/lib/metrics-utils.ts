const INTERVAL_SECONDS = 3;
const MAX_SNAPSHOTS = 600; // 30 minutes at 3-second intervals

interface HasTimestamp {
  timestamp?: { seconds: string; nanos: number };
}

function formatTimeFromDate(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/// Pads a sparse snapshot array into a full 30-minute time grid.
/// Returns 600 entries at 3-second intervals; slots without a real
/// snapshot have `snapshot: null` so Recharts renders gaps.
export function padSnapshots<T extends HasTimestamp>(
  snapshots: T[],
): { time: string; snapshot: T | null }[] {
  const nowMs = Date.now();
  const intervalMs = INTERVAL_SECONDS * 1000;
  // Align "now" to the nearest 3-second boundary
  const endSlot = Math.round(nowMs / intervalMs) * intervalMs;
  const startSlot = endSlot - (MAX_SNAPSHOTS - 1) * intervalMs;

  // Index snapshots by their rounded time slot
  const snapshotMap = new Map<number, T>();
  for (const s of snapshots) {
    if (!s.timestamp) continue;
    const ms =
      Number(s.timestamp.seconds) * 1000 + s.timestamp.nanos / 1_000_000;
    const slotMs = Math.round(ms / intervalMs) * intervalMs;
    snapshotMap.set(slotMs, s);
  }

  const result: { time: string; snapshot: T | null }[] = [];
  for (let i = 0; i < MAX_SNAPSHOTS; i++) {
    const slotMs = startSlot + i * intervalMs;
    result.push({
      time: formatTimeFromDate(new Date(slotMs)),
      snapshot: snapshotMap.get(slotMs) ?? null,
    });
  }

  return result;
}
