import { InferenceProvider, PromptBuilderOutput } from "../adapter";

export interface OpenAIProviderOptions {
  apiKey?: string;
  model?: string;
}

/**
 * Server-Side OpenAI Inference Provider (supporting gpt-4o, gpt-4o-mini, o3-mini).
 * Supports automatic multi-turn continuation when finish_reason === "length".
 */
export class OpenAIProvider implements InferenceProvider {
  private apiKey?: string;
  private model: string;

  constructor(options?: OpenAIProviderOptions) {
    this.apiKey = options?.apiKey || process.env.OPENAI_API_KEY;
    this.model = options?.model || process.env.OPENAI_MODEL || "gpt-4o";
  }

  async execute(prompt: PromptBuilderOutput): Promise<string> {
    const key = this.apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error("ERR_PROVIDER_FAILURE: Missing OPENAI_API_KEY environment variable or constructor option.");
    }

    const MAX_CONTINUATIONS = 3;
    const parts: string[] = [];
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: prompt.systemPrompt },
      { role: "user", content: prompt.userPrompt }
    ];

    for (let i = 0; i <= MAX_CONTINUATIONS; i++) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: "json_object" },
          messages,
          temperature: 0.1,
          max_tokens: 16384
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ERR_PROVIDER_FAILURE: OpenAI API returned ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const chunk = choice?.message?.content || "";
      if (!chunk) {
        if (parts.length > 0) break;
        throw new Error("ERR_PROVIDER_FAILURE: OpenAI returned empty content response.");
      }

      parts.push(chunk);

      if (choice?.finish_reason !== "length") {
        break;
      }

      messages.push({ role: "assistant", content: chunk });
      messages.push({
        role: "user",
        content: "Continue exactly where the previous output stopped. Do not restart, summarize or repeat completed sections."
      });
    }

    return parts.join("\n");
  }
}
