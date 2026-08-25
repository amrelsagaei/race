import type { StrategyEnum } from "shared";

import type { FrontendSDK } from "@/types";

export const SESSION_KIND_PIPELINE = "HTTP_ONE_PIPELINE";
export const POLL_INTERVAL_MS = 200;
export const DEFAULT_TIMEOUT_MS = 30000;
export const TRANSFORM_TIMEOUT_MS = 5000;
const TRANSFORM_PER_REQUEST_MS = 250;

export function transformBudgetMs(count: number): number {
  return TRANSFORM_TIMEOUT_MS + count * TRANSFORM_PER_REQUEST_MS;
}
export const SESSION_CLEANUP_RETRY_MS = 1000;
export const SESSION_CLEANUP_ATTEMPTS = 8;

type SessionVariables = Parameters<
  FrontendSDK["graphql"]["createReplayPipelineHttpOneSession"]
>[0];
type SessionSettings = SessionVariables["input"]["settings"];

const CURRENT_STRATEGY: Record<StrategyEnum, unknown> = {
  LastByteSynchronization: {
    lastByteSynchronization: { failureBehavior: "ABORT_ON_PARTIAL" },
  },
  SinglePacketAttack: {
    singlePacketAttack: {
      convertToHttp2: true,
      failureBehavior: "ABORT_ON_PARTIAL",
    },
  },
  Sequential: { sequential: { abortOnFailure: false } },
};

const LEGACY_STRATEGY: Partial<Record<StrategyEnum, unknown>> = {
  LastByteSynchronization: "LAST_BYTE_SYNCHRONIZATION",
  Sequential: "SEQUENTIAL",
};

export function pipelineSettingsCandidates(
  strategy: StrategyEnum,
): SessionSettings[] {
  const candidates: unknown[] = [{ strategy: CURRENT_STRATEGY[strategy] }];
  const legacy = LEGACY_STRATEGY[strategy];
  if (legacy !== undefined) {
    candidates.push({ strategy: legacy });
  }
  return candidates as SessionSettings[];
}
