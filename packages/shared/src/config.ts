import { z } from "zod";

import { StrategyEnumSchema } from "./enums";

export const RaceRunConfigSchema = z
  .object({
    requestCount: z.number().int().min(2),
    groupCount: z.number().int().min(1),
    betweenGroupDelayMs: z.number().int().min(0),
    timeoutMs: z.number().int().min(0),
    strategy: StrategyEnumSchema,
    jsHook: z.string().optional(),
    label: z.string().optional(),
  })
  .strict();
export type RaceRunConfig = z.infer<typeof RaceRunConfigSchema>;
