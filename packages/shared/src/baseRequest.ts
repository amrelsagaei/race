import { z } from "zod";

import { RaceConnectionSchema } from "./connection";

export const RaceBaseRequestSchema = z.object({
  raw: z.string(),
  connection: RaceConnectionSchema,
});
export type RaceBaseRequest = z.infer<typeof RaceBaseRequestSchema>;
