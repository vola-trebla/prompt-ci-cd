import { z } from 'zod';

const AssertionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('contains'), value: z.string() }),
  z.object({ type: z.literal('not_contains'), value: z.string() }),
  z.object({ type: z.literal('matches_regex'), value: z.string() }),
  z.object({ type: z.literal('max_length'), value: z.number().positive() }),
  z.object({ type: z.literal('is_json') }),
]);

export const TestCaseSchema = z.object({
  id: z.string().min(1),
  description: z.string().optional(),
  variables: z.record(z.string()).optional(),
  assertions: z.array(AssertionSchema).min(1),
});

export const EvalSuiteSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  cases: z.array(TestCaseSchema).min(1),
});

export type Assertion = z.infer<typeof AssertionSchema>;
export type TestCase = z.infer<typeof TestCaseSchema>;
export type EvalSuite = z.infer<typeof EvalSuiteSchema>;
