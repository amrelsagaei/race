import { z } from "zod";

export const RaceConnectionSchema = z.object({
  host: z.string(),
  port: z.number().int(),
  isTls: z.boolean(),
  sni: z.string().optional(),
});
export type RaceConnection = z.infer<typeof RaceConnectionSchema>;
