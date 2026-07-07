import { z } from "zod";

export const STRATEGIES = ["Sequential", "LastByteSynchronization"] as const;
export const StrategyEnumSchema = z.enum(STRATEGIES);
export type StrategyEnum = z.infer<typeof StrategyEnumSchema>;

export const RUN_STATUSES = [
  "queued",
  "running",
  "completed",
  "failed",
  "partial",
] as const;
export const RunStatusEnumSchema = z.enum(RUN_STATUSES);
export type RunStatus = z.infer<typeof RunStatusEnumSchema>;

export const ENTRY_STATUSES = ["pending", "sent", "received", "error"] as const;
export const EntryStatusEnumSchema = z.enum(ENTRY_STATUSES);
export type EntryStatus = z.infer<typeof EntryStatusEnumSchema>;
