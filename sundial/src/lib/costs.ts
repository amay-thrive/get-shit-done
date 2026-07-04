/**
 * Model pricing in microdollars (1e-6 USD) per token.
 * Stored as integers end-to-end — money is never a float in this codebase.
 */
const PRICING: Record<string, { input: number; output: number }> = {
  // $3 / $15 per million tokens
  "claude-sonnet-4-5": { input: 3, output: 15 },
  // $1 / $5 per million tokens
  "claude-haiku-4-5": { input: 1, output: 5 },
  // $15 / $75 per million tokens
  "claude-opus-4-6": { input: 15, output: 75 },
};

export function costMicrodollars(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const p = PRICING[model] ?? PRICING["claude-sonnet-4-5"]!;
  return Math.round(inputTokens * p.input + outputTokens * p.output);
}

export function formatCost(microdollars: number): string {
  if (microdollars < 10_000) return `$${(microdollars / 1_000_000).toFixed(4)}`;
  return `$${(microdollars / 1_000_000).toFixed(2)}`;
}
