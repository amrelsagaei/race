import { z } from "zod";

import { RaceConnectionSchema } from "./connection";
import { EntryStatusEnumSchema } from "./enums";

export const RaceEntrySchema = z.object({
  request: z.object({
    raw: z.string(),
    connection: RaceConnectionSchema,
  }),
  response: z
    .object({
      raw: z.string(),
      statusCode: z.number().int().optional(),
      roundtripTime: z.number().optional(),
      length: z.number().int().optional(),
    })
    .optional(),
  status: EntryStatusEnumSchema,
  error: z.string().optional(),
  sentAt: z.string().optional(),
});
export type RaceEntry = z.infer<typeof RaceEntrySchema>;

export const RaceGroupSchema = z.object({
  index: z.number().int().min(0),
  startedAt: z.string(),
  entries: z.array(RaceEntrySchema),
});
export type RaceGroup = z.infer<typeof RaceGroupSchema>;
