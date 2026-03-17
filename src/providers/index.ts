import type { PromptFile } from '../types/index.js';
import type { LlmProvider } from './types.js';
import { GeminiProvider } from './gemini.js';

/** Factory — creates the right provider based on prompt config. */
export function createProvider(prompt: PromptFile): LlmProvider {
  switch (prompt.model.provider) {
    case 'gemini': {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is required');
      return new GeminiProvider(apiKey);
    }
    case 'anthropic':
      throw new Error('Anthropic provider not implemented yet');
    case 'openai':
      throw new Error('OpenAI provider not implemented yet');
  }
}

export type { LlmProvider, LlmResponse } from './types.js';
