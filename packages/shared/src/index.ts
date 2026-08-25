import type { DefinePluginPackageSpec } from "@caido/sdk-shared";

import type { API } from "./api";
import type { Events } from "./events";

export { type Result, ok, err } from "./result";

export {
  STRATEGIES,
  StrategyEnumSchema,
  type StrategyEnum,
  RUN_STATUSES,
  RunStatusEnumSchema,
  type RunStatus,
  ENTRY_STATUSES,
  EntryStatusEnumSchema,
  type EntryStatus,
} from "./enums";

export { RaceConnectionSchema, type RaceConnection } from "./connection";
export { RaceSeedSchema, type RaceSeed } from "./seed";
export { RaceRunConfigSchema, type RaceRunConfig } from "./config";
export {
  RaceEntrySchema,
  type RaceEntry,
  RaceGroupSchema,
  type RaceGroup,
} from "./entry";
export {
  RACE_STORE_VERSION,
  RaceRunSummarySchema,
  type RaceRunSummary,
  RaceRunBodySchema,
  type RaceRunBody,
  RaceRunSchema,
  type RaceRun,
  RaceRunInputSchema,
  type RaceRunInput,
} from "./run";

export type { API } from "./api";
export type { Events } from "./events";

export type Spec = DefinePluginPackageSpec<{
  manifestId: "race";
  api: API;
  events: Events;
}>;
