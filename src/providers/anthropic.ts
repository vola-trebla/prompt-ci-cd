import Anthropic from '@anthropic-ai/sdk';
import type { LlmProvider, LlmResponse } from './types.js';

export class AnthropicProvider implements LlmProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generate(prompt: string, model: string): Promise<LlmResponse> {
    const start = performance.now();

    const message = await this.client.messages.create({
      model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const latencyMs = Math.round(performance.now() - start);
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const totalTokens = message.usage.input_tokens + message.usage.output_tokens;

    return { text, latencyMs, totalTokens };
  }
}
