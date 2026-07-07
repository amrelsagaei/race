import type { RaceConnection, RaceSeed, StrategyEnum } from "shared";

export type BurstEntry = {
  requestRaw: string;
  connection: RaceConnection;
  method: string | undefined;
  path: string | undefined;
  responseId: string | undefined;
  statusCode: number | undefined;
  roundtripTime: number | undefined;
  length: number | undefined;
  error: string | undefined;
};

export type PollResult = {
  entries: BurstEntry[];
  timedOut: boolean;
  pipelineError: string | undefined;
};

export type LiveResult = {
  index: number;
  method: string | undefined;
  path: string | undefined;
  status: "pending" | "received" | "error";
  statusCode: number | undefined;
  length: number | undefined;
  roundtripTime: number | undefined;
};

type RaceProgress = {
  groupIndex: number;
  groupCount: number;
  results: LiveResult[];
};

export type ProgressCallback = (progress: RaceProgress) => void;

export type ResultRow = {
  index: number;
  method: string;
  path: string;
  status: number | undefined;
  length: number | undefined;
  time: number | undefined;
  requestRaw: string;
  responseRaw: string;
};

export type BurstParams = {
  seed: RaceSeed;
  count: number;
  script: string | undefined;
  collectionId: string | undefined;
  strategy: StrategyEnum;
  timeoutMs: number;
  index: number;
  onProgress: ((results: LiveResult[]) => void) | undefined;
  shouldAbort: () => boolean;
};

export type RaceControls = { shouldAbort: () => boolean };
