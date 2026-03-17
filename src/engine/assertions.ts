import type { Assertion } from '../types/index.js';

export interface AssertionResult {
  assertion: Assertion;
  passed: boolean;
  detail: string;
}

/** Runs a single assertion against LLM output text. */
function checkAssertion(text: string, assertion: Assertion): AssertionResult {
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
  }
}

/** Runs all assertions for a test case against LLM output. */
export function checkAssertions(text: string, assertions: Assertion[]): AssertionResult[] {
  return assertions.map((a) => checkAssertion(text, a));
}
