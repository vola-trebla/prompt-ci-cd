import OpenAI from 'openai';
import type { LlmProvider, LlmResponse } from './types.js';

export class OpenAIProvider implements LlmProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generate(prompt: string, model: string): Promise<LlmResponse> {
    const start = performance.now();

    const completion = await this.client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
    });

    const latencyMs = Math.round(performance.now() - start);
    const text = completion.choices[0]?.message.content ?? '';
    const totalTokens = completion.usage?.total_tokens ?? 0;

    return { text, latencyMs, totalTokens };
  }
}
