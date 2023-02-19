import { z } from "zod";

export const ActivitySchema = z.object({
  name: z.string().min(1).max(128),
  count: z.number().min(1).max(1000),
  timestamp: z.string().datetime().optional(),
});

export type ActivitySchema = z.infer<typeof ActivitySchema>;
