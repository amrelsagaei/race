import type { StrategyEnum } from "shared";

export const SESSION_KIND_PIPELINE = "HTTP_ONE_PIPELINE";
export const POLL_INTERVAL_MS = 200;
export const DEFAULT_TIMEOUT_MS = 30000;
export const TRANSFORM_TIMEOUT_MS = 5000;

const STRATEGY_MAP: Record<
  StrategyEnum,
  "LAST_BYTE_SYNCHRONIZATION" | "SEQUENTIAL"
> = {
  LastByteSynchronization: "LAST_BYTE_SYNCHRONIZATION",
  Sequential: "SEQUENTIAL",
};

export function toGraphqlStrategy(
  strategy: StrategyEnum,
): "LAST_BYTE_SYNCHRONIZATION" | "SEQUENTIAL" {
  return STRATEGY_MAP[strategy];
}
