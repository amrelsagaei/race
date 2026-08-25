import type { RaceGroup } from "./entry";
import type { RunStatus } from "./enums";
import type { Result } from "./result";
import type { RaceRun, RaceRunInput, RaceRunSummary } from "./run";

export type API = {
  listRuns: () => Result<RaceRunSummary[]>;
  getRun: (runId: string) => Promise<Result<RaceRun | undefined>>;
  persistRun: (input: RaceRunInput) => Promise<Result<RaceRunSummary>>;
  appendGroup: (runId: string, group: RaceGroup) => Promise<Result<void>>;
  updateStatus: (
    runId: string,
    status: RunStatus,
  ) => Promise<Result<RaceRunSummary>>;
  deleteRun: (runId: string) => Promise<Result<void>>;
  clearRuns: () => Promise<Result<void>>;
};
