import { InferenceProvider, PromptBuilderOutput } from "../adapter";

export interface AnthropicProviderOptions {
  apiKey?: string;
  model?: string;
}

/**
 * Server-Side Anthropic Claude Inference Provider (supporting claude-3-5-sonnet, claude-3-5-haiku).
 * Supports automatic multi-turn continuation when stop_reason === "max_tokens".
 */
export class AnthropicProvider implements InferenceProvider {
  private apiKey?: string;
  private model: string;

  constructor(options?: AnthropicProviderOptions) {
    this.apiKey = options?.apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = options?.model || process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
  }

  async execute(prompt: PromptBuilderOutput): Promise<string> {
    const key = this.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error("ERR_PROVIDER_FAILURE: Missing ANTHROPIC_API_KEY environment variable or constructor option.");
    }

    const MAX_CONTINUATIONS = 3;
    const parts: string[] = [];
    const messages: Array<{ role: string; content: string }> = [
      { role: "user", content: prompt.userPrompt }
    ];

    for (let i = 0; i <= MAX_CONTINUATIONS; i++) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 8192,
          system: prompt.systemPrompt,
          messages
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ERR_PROVIDER_FAILURE: Anthropic API returned ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const chunk = data.content?.[0]?.text || "";
      if (!chunk) {
        if (parts.length > 0) break;
        throw new Error("ERR_PROVIDER_FAILURE: Anthropic returned empty content response.");
      }

      parts.push(chunk);

      if (data.stop_reason !== "max_tokens") {
        break;
      }

      // Append assistant response and prompt continuation
      messages.push({ role: "assistant", content: chunk });
      messages.push({
        role: "user",
        content: "Continue exactly where the previous output stopped. Do not restart, summarize or repeat completed sections."
      });
    }

    return parts.join("\n");
  }
}
