import { defineEvalConfig } from "eve/evals";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Judge reuses the existing Ollama Cloud key but a different model family than
// the GLM under test, so scores aren't self-graded. A string id like
// "anthropic/claude-haiku-4.5" would route via the Vercel AI Gateway instead
// (needs AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN).
const ollama = createOpenAICompatible({
  name: "ollama",
  baseURL: "https://ollama.com/v1",
  apiKey: process.env.OLLAMA_API_KEY ?? "",
});

export default defineEvalConfig({
  judge: { model: ollama("deepseek-v4-flash:cloud") },
});
