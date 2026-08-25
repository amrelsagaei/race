import type { RunStatus, StrategyEnum } from "shared";

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}

export function formatSentAt(iso: string | undefined): string {
  if (iso === undefined) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const millis = String(date.getMilliseconds()).padStart(3, "0");
  return `${date.toLocaleTimeString(undefined, { hour12: false })}.${millis}`;
}

const STRATEGY_LABELS: Record<StrategyEnum, string> = {
  LastByteSynchronization: "Last-byte sync",
  SinglePacketAttack: "Single packet",
  Sequential: "Sequential",
};

export function strategyLabel(strategy: StrategyEnum): string {
  return STRATEGY_LABELS[strategy];
}

export function statusCodeSummary(codeCounts: Record<string, number>): string {
  const parts = Object.entries(codeCounts)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([code, count]) => `${code} (${count})`);
  return parts.length > 0 ? parts.join(", ") : "-";
}

export function timingRange(
  minMs: number | undefined,
  maxMs: number | undefined,
): string {
  if (minMs === undefined || maxMs === undefined) {
    return "-";
  }
  const low = Math.round(minMs);
  const high = Math.round(maxMs);
  return low === high ? `${low} ms` : `${low}-${high} ms`;
}

export function statusClass(status: RunStatus): string {
  switch (status) {
    case "completed":
      return "bg-success-500/20 text-success-300";
    case "running":
      return "bg-blue-500/20 text-blue-300";
    case "failed":
      return "bg-red-500/20 text-red-300";
    case "partial":
      return "bg-yellow-500/20 text-yellow-300";
    case "cancelled":
      return "bg-surface-600/40 text-surface-300";
    default:
      return "bg-surface-600/40 text-surface-300";
  }
}
