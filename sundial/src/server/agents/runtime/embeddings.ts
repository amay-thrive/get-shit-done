import { optionalEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Embeddings for semantic memory (pgvector, 1536 dims).
 * Uses OpenAI text-embedding-3-small when OPENAI_API_KEY is set;
 * otherwise returns null and memory falls back to recency-based recall.
 */
export async function embed(text: string): Promise<number[] | null> {
  const key = optionalEnv("OPENAI_API_KEY");
  if (!key) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text.slice(0, 8000),
      }),
    });
    if (!res.ok) {
      logger.warn("Embedding request failed", { status: res.status });
      return null;
    }
    const data = (await res.json()) as { data: { embedding: number[] }[] };
    return data.data[0]?.embedding ?? null;
  } catch (err) {
    logger.error("Embedding error", err);
    return null;
  }
}

/** pgvector expects a string literal like "[0.1,0.2,...]". */
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
