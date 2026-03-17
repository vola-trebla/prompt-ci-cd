import type { PromptFile } from '../types/index.js';
import type { LlmProvider } from './types.js';
import { GeminiProvider } from './gemini.js';
import { AnthropicProvider } from './anthropic.js';
import { OpenAIProvider } from './openai.js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is required`);
  return value;
}

/** Factory — creates the right provider based on prompt config. */
export function createProvider(prompt: PromptFile): LlmProvider {
  switch (prompt.model.provider) {
    case 'gemini':
      return new GeminiProvider(requireEnv('GEMINI_API_KEY'));
    case 'anthropic':
      return new AnthropicProvider(requireEnv('ANTHROPIC_API_KEY'));
    case 'openai':
      return new OpenAIProvider(requireEnv('OPENAI_API_KEY'));
  }
}

export type { LlmProvider, LlmResponse } from './types.js';
