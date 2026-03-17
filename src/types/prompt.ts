import { z } from 'zod';

/** Prompt file schema — defines the YAML format for storing prompts with metadata. */
export const PromptFileSchema = z.object({
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be semver: X.Y.Z'),
  description: z.string().optional(),
  model: z.object({
    provider: z.enum(['gemini', 'anthropic', 'openai']),
    name: z.string().min(1),
  }),
  eval_suite: z.string().min(1),
  template: z.string().min(1),
});

export type PromptFile = z.infer<typeof PromptFileSchema>;
