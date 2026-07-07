import { z } from "zod";

import { RaceRunConfigSchema } from "./config";
import { RaceConnectionSchema } from "./connection";
import { RaceGroupSchema } from "./entry";
import { RunStatusEnumSchema, StrategyEnumSchema } from "./enums";

export const RACE_STORE_VERSION = 1;

export const RaceRunSummarySchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  createdAt: z.string(),
  target: RaceConnectionSchema,
  status: RunStatusEnumSchema,
  strategy: StrategyEnumSchema,
  groupCount: z.number().int(),
  requestCount: z.number().int(),
  completedGroups: z.number().int(),
  entryCount: z.number().int(),
  completedCount: z.number().int(),
  errorCount: z.number().int(),
  codeCounts: z.record(z.string(), z.number().int()),
  minMs: z.number().optional(),
  maxMs: z.number().optional(),
});
export type RaceRunSummary = z.infer<typeof RaceRunSummarySchema>;

export const RaceRunSchema = z.object({
  summary: RaceRunSummarySchema,
  config: RaceRunConfigSchema,
  groups: z.array(RaceGroupSchema),
});
export type RaceRun = z.infer<typeof RaceRunSchema>;

export const RaceRunInputSchema = z.object({
  config: RaceRunConfigSchema,
  target: RaceConnectionSchema,
  label: z.string().optional(),
});
export type RaceRunInput = z.infer<typeof RaceRunInputSchema>;
