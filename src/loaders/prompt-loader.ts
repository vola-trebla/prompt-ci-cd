import { resolve, dirname } from 'node:path';
import { PromptFileSchema, EvalSuiteSchema } from '../types/index.js';
import type { PromptFile, EvalSuite } from '../types/index.js';
import { loadYaml } from './yaml-loader.js';

/** Loads a prompt file and its linked eval suite. Resolves eval_suite path relative to the prompt file. */
export async function loadPromptWithEval(promptPath: string): Promise<{
  prompt: PromptFile;
  evalSuite: EvalSuite;
}> {
  const prompt = await loadYaml(promptPath, PromptFileSchema);
  const evalPath = resolve(dirname(promptPath), prompt.eval_suite);
  const evalSuite = await loadYaml(evalPath, EvalSuiteSchema);

  return { prompt, evalSuite };
}
