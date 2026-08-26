import { z } from "zod";

import { StrategyEnumSchema } from "./enums";

export const RaceRunConfigSchema = z
  .object({
    requestCount: z.number().int().min(2).max(500),
    groupCount: z.number().int().min(1).max(100),
    betweenGroupDelayMs: z.number().int().min(0).max(600000),
    timeoutMs: z.number().int().min(100).max(600000),
    strategy: StrategyEnumSchema,
    jsHook: z.string().optional(),
    label: z.string().max(120).optional(),
  })
  .strict();
export type RaceRunConfig = z.infer<typeof RaceRunConfigSchema>;
