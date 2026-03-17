import { z } from 'zod';

/** Baseline — saved metrics from a reference prompt run, used for regression detection. */
export const BaselineSchema = z.object({
  prompt_name: z.string().min(1),
  prompt_version: z.string(),
  created_at: z.string(),
  model: z.object({
    provider: z.string(),
    name: z.string(),
  }),
  metrics: z.object({
    accuracy: z.number().min(0).max(1),
    avg_latency_ms: z.number().nonnegative(),
    total_tokens: z.number().nonnegative(),
  }),
  per_case: z.array(
    z.object({
      case_id: z.string(),
      passed: z.boolean(),
      latency_ms: z.number(),
      tokens: z.number(),
    }),
  ),
});

export type Baseline = z.infer<typeof BaselineSchema>;
