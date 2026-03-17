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

/** Runs a single test case: render template → call LLM → check assertions. */
async function runCase(
  prompt: PromptFile,
  testCase: TestCase,
  provider: LlmProvider,
): Promise<CaseResult> {
  const renderedPrompt = renderTemplate(prompt.template, testCase.variables ?? {});
  const response = await provider.generate(renderedPrompt, prompt.model.name);
  const assertions = checkAssertions(response.text, testCase.assertions);
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

/** Runs all test cases in an eval suite and computes aggregate metrics. */
export async function runEval(
  prompt: PromptFile,
  evalSuite: EvalSuite,
  provider: LlmProvider,
): Promise<EvalResult> {
  const cases: CaseResult[] = [];

  for (const testCase of evalSuite.cases) {
    const result = await runCase(prompt, testCase, provider);
    cases.push(result);
  }

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
