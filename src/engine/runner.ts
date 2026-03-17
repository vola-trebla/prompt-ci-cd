import type { PromptFile, EvalSuite, TestCase } from '../types/index.js';
import type { LlmProvider } from '../providers/types.js';
import { renderTemplate } from './template.js';
import { checkAssertions, type AssertionResult } from './assertions.js';

export interface CaseResult {
  caseId: string;
  passed: boolean;
  latencyMs: number;
  tokens: number;
  assertions: AssertionResult[];
  llmOutput: string;
}

export interface EvalResult {
  promptName: string;
  promptVersion: string;
  model: { provider: string; name: string };
  cases: CaseResult[];
  metrics: {
    accuracy: number;
    avgLatencyMs: number;
    totalTokens: number;
  };
}

export interface RunOptions {
  /** Provider for llm_judge assertions. Falls back to main provider if not set. */
  judgeProvider?: LlmProvider;
  /** Max concurrent LLM calls. Default: 3 */
  concurrency?: number;
}

/** Runs a single test case: render template → call LLM → check assertions. */
async function runCase(
  prompt: PromptFile,
  testCase: TestCase,
  provider: LlmProvider,
  judgeProvider?: LlmProvider,
): Promise<CaseResult> {
  const renderedPrompt = renderTemplate(prompt.template, testCase.variables ?? {});
  const response = await provider.generate(renderedPrompt, prompt.model.name);

  const hasJudge = testCase.assertions.some((a) => a.type === 'llm_judge');
  const assertions = await checkAssertions(
    response.text,
    testCase.assertions,
    hasJudge ? (judgeProvider ?? provider) : undefined,
  );
  const passed = assertions.every((a) => a.passed);

  return {
    caseId: testCase.id,
    passed,
    latencyMs: response.latencyMs,
    tokens: response.totalTokens,
    assertions,
    llmOutput: response.text,
  };
}

/** Runs promises in batches of `concurrency` at a time. */
async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((fn) => fn()));
    results.push(...batchResults);
  }
  return results;
}

/** Runs all test cases in an eval suite (parallel) and computes aggregate metrics. */
export async function runEval(
  prompt: PromptFile,
  evalSuite: EvalSuite,
  provider: LlmProvider,
  options: RunOptions = {},
): Promise<EvalResult> {
  const { judgeProvider, concurrency = 3 } = options;

  const tasks = evalSuite.cases.map(
    (testCase: TestCase) => () => runCase(prompt, testCase, provider, judgeProvider),
  );

  const cases = await runWithConcurrency(tasks, concurrency);

  const passedCount = cases.filter((c) => c.passed).length;
  const totalLatency = cases.reduce((sum, c) => sum + c.latencyMs, 0);
  const totalTokens = cases.reduce((sum, c) => sum + c.tokens, 0);

  return {
    promptName: prompt.name,
    promptVersion: prompt.version,
    model: prompt.model,
    cases,
    metrics: {
      accuracy: passedCount / cases.length,
      avgLatencyMs: Math.round(totalLatency / cases.length),
      totalTokens,
    },
  };
}
