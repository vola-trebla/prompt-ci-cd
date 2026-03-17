/** Standardized LLM response — same shape regardless of provider. */
export interface LlmResponse {
  text: string;
  latencyMs: number;
  totalTokens: number;
}

/** Provider interface — implement this for each LLM (Gemini, Anthropic, OpenAI). */
export interface LlmProvider {
  generate(prompt: string, model: string): Promise<LlmResponse>;
}
