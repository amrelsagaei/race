import { z } from "zod";

export const STRATEGIES = [
  "Sequential",
  "LastByteSynchronization",
  "SinglePacketAttack",
] as const;
export const StrategyEnumSchema = z.enum(STRATEGIES);
export type StrategyEnum = z.infer<typeof StrategyEnumSchema>;

export const RUN_STATUSES = [
  "running",
  "completed",
  "failed",
  "partial",
  "cancelled",
] as const;
export const RunStatusEnumSchema = z.enum(RUN_STATUSES);
export type RunStatus = z.infer<typeof RunStatusEnumSchema>;

export const ENTRY_STATUSES = ["pending", "received", "error"] as const;
export const EntryStatusEnumSchema = z.enum(ENTRY_STATUSES);
export type EntryStatus = z.infer<typeof EntryStatusEnumSchema>;
