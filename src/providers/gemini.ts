import { GoogleGenAI } from '@google/genai';
import type { LlmProvider, LlmResponse } from './types.js';

export class GeminiProvider implements LlmProvider {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generate(prompt: string, model: string): Promise<LlmResponse> {
    const start = performance.now();

    const response = await this.ai.models.generateContent({
      model,
      contents: prompt,
    });

    const latencyMs = Math.round(performance.now() - start);
    const text = response.text ?? '';
    const totalTokens = response.usageMetadata?.totalTokenCount ?? 0;

    return { text, latencyMs, totalTokens };
  }
}
