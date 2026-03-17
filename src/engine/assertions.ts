import type { Assertion } from '../types/index.js';
import type { LlmProvider } from '../providers/types.js';

export interface AssertionResult {
  assertion: Assertion;
  passed: boolean;
  detail: string;
}

/** Runs a single assertion against LLM output text. */
async function checkAssertion(
  text: string,
  assertion: Assertion,
  judgeProvider?: LlmProvider,
): Promise<AssertionResult> {
  switch (assertion.type) {
    case 'contains':
      return {
        assertion,
        passed: text.toLowerCase().includes(assertion.value.toLowerCase()),
        detail: `Expected to contain "${assertion.value}"`,
      };

    case 'not_contains':
      return {
        assertion,
        passed: !text.toLowerCase().includes(assertion.value.toLowerCase()),
        detail: `Expected NOT to contain "${assertion.value}"`,
      };

    case 'matches_regex': {
      const regex = new RegExp(assertion.value);
      return {
        assertion,
        passed: regex.test(text),
        detail: `Expected to match /${assertion.value}/`,
      };
    }

    case 'max_length':
      return {
        assertion,
        passed: text.length <= assertion.value,
        detail: `Length ${text.length} vs max ${assertion.value}`,
      };

    case 'is_json': {
      let valid = false;
      try {
        JSON.parse(text);
        valid = true;
      } catch {
        // invalid JSON
      }
      return {
        assertion,
        passed: valid,
        detail: valid ? 'Valid JSON' : 'Invalid JSON',
      };
    }

    case 'llm_judge': {
      if (!judgeProvider) {
        return {
          assertion,
          passed: false,
          detail: 'LLM judge requires a provider — skipped',
        };
      }

      const judgePrompt = [
        'You are an evaluation judge. Assess the following LLM output against the given criteria.',
        'Respond with exactly "PASS" or "FAIL" on the first line, then a brief explanation.',
        '',
        `Criteria: ${assertion.criteria}`,
        '',
        `Output to evaluate:`,
        text,
      ].join('\n');

      const judgeResponse = await judgeProvider.generate(judgePrompt, 'gemini-2.5-flash');
      const firstLine = judgeResponse.text.trim().split('\n')[0].toUpperCase();
      const passed = firstLine.includes('PASS');

      return {
        assertion,
        passed,
        detail: `LLM judge (${assertion.criteria}): ${firstLine}`,
      };
    }
  }
}

/** Runs all assertions for a test case against LLM output. */
export async function checkAssertions(
  text: string,
  assertions: Assertion[],
  judgeProvider?: LlmProvider,
): Promise<AssertionResult[]> {
  const results: AssertionResult[] = [];
  for (const a of assertions) {
    results.push(await checkAssertion(text, a, judgeProvider));
  }
  return results;
}
