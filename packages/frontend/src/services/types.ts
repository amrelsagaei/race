import type {
  EntryStatus,
  RaceConnection,
  RaceSeed,
  StrategyEnum,
} from "shared";

type ConnectionInfoInput = {
  host: string;
  port: number;
  isTLS: boolean;
  SNI: string | undefined;
};

export type RequestSource = {
  raw: { raw: string; connectionInfo: ConnectionInfoInput };
};

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
  sentAt: string | undefined;
};

export type PollResult = {
  entries: BurstEntry[];
  timedOut: boolean;
  aborted: boolean;
  pipelineError: string | undefined;
};

export type LiveResult = {
  index: number;
  method: string | undefined;
  path: string | undefined;
  status: EntryStatus;
  statusCode: number | undefined;
  length: number | undefined;
  roundtripTime: number | undefined;
  sentAt: string | undefined;
  error: string | undefined;
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
  sentAt: string | undefined;
  error: string | undefined;
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
