import { z } from "zod";

import { RaceConnectionSchema } from "./connection";

export const RaceSeedSchema = z.object({
  raw: z.string(),
  connection: RaceConnectionSchema,
  sourceRequestId: z.string().optional(),
});
export type RaceSeed = z.infer<typeof RaceSeedSchema>;
