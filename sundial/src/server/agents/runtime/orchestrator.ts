import { generateText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { adminClient } from "@/lib/supabase/admin";
import { createId } from "@/lib/id";
import { logger } from "@/lib/logger";
import { costMicrodollars } from "@/lib/costs";
import { selectTools, type ToolContext } from "./tools";

export interface ExecuteAgentInput {
  agentName: string;
  triggerType: "manual" | "cron" | "event" | "chain" | "api";
  triggerSource?: string;
  input?: Record<string, unknown>;
  correlationId?: string;
}

export interface AgentRunResult {
  runId: string;
  status: "completed" | "failed";
  output?: string;
  error?: string;
}

/** Anthropic tool names cannot contain dots; we namespace with dots for humans. */
const sanitize = (name: string) => name.replace(/\./g, "__");
const desanitize = (name: string) => name.replace(/__/g, ".");

/**
 * Durable agent execution. Every step (reasoning, tool call, tool result)
 * is checkpointed to agent_steps as it happens, so the dashboard streams
 * live progress via Supabase Realtime and failed runs are fully forensic.
 */
export async function executeAgent(
  params: ExecuteAgentInput
): Promise<AgentRunResult> {
  const db = adminClient();
  const runId = createId("run");
  const correlationId = params.correlationId ?? createId("cor");

  const { data: agent, error: agentErr } = await db
    .from("agent_definitions")
    .select("*")
    .eq("name", params.agentName)
    .single();

  if (agentErr || !agent) {
    return { runId, status: "failed", error: `Unknown agent: ${params.agentName}` };
  }
  if (!agent.enabled) {
    return { runId, status: "failed", error: `Agent disabled: ${params.agentName}` };
  }

  await db.from("agent_runs").insert({
    id: runId,
    agent_id: agent.id,
    trigger_type: params.triggerType,
    trigger_source: params.triggerSource ?? null,
    status: "running",
    input: (params.input ?? {}) as never,
    correlation_id: correlationId,
    started_at: new Date().toISOString(),
  });

  let stepIndex = 0;
  const checkpoint = async (
    kind: "thinking" | "tool_call" | "tool_result" | "message",
    content: Record<string, unknown>,
    toolName?: string
  ) => {
    const idx = stepIndex++;
    const { error } = await db.from("agent_steps").insert({
      id: createId("stp"),
      run_id: runId,
      step_index: idx,
      kind,
      tool_name: toolName ?? null,
      content: content as never,
    });
    if (error) logger.error("Step checkpoint failed", error, { runId, idx });
  };

  const toolCtx: ToolContext = {
    runId,
    agentId: agent.id,
    agentName: agent.name,
    approvalGated: new Set(agent.requires_approval_for),
  };

  const dottedTools = selectTools(toolCtx, agent.tools);
  const tools = Object.fromEntries(
    Object.entries(dottedTools).map(([name, t]) => [sanitize(name), t])
  );

  const started = Date.now();
  try {
    const result = await generateText({
      model: anthropic(agent.model),
      system: agent.system_prompt,
      prompt: buildPrompt(params),
      tools,
      stopWhen: stepCountIs(agent.max_steps),
      onStepFinish: async (step) => {
        for (const call of step.toolCalls) {
          await checkpoint(
            "tool_call",
            { input: call.input as Record<string, unknown> },
            desanitize(call.toolName)
          );
        }
        for (const res of step.toolResults) {
          await checkpoint(
            "tool_result",
            { output: res.output as Record<string, unknown> },
            desanitize(res.toolName)
          );
        }
        if (step.text) {
          await checkpoint("message", { text: step.text });
        }
      },
    });

    const inputTokens = result.totalUsage.inputTokens ?? 0;
    const outputTokens = result.totalUsage.outputTokens ?? 0;

    await db
      .from("agent_runs")
      .update({
        status: "completed",
        output: { text: result.text } as never,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_microdollars: costMicrodollars(agent.model, inputTokens, outputTokens),
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);

    await db.from("events").insert({
      event_id: createId("evt"),
      type: "agent.run.completed",
      actor_type: "agent",
      actor_id: agent.name,
      subject_type: "agent_run",
      subject_id: runId,
      payload: {
        agent: agent.name,
        duration_ms: Date.now() - started,
        steps: stepIndex,
      } as never,
      correlation_id: correlationId,
    });

    return { runId, status: "completed", output: result.text };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Agent run failed", err, { runId, agent: agent.name });

    await db
      .from("agent_runs")
      .update({
        status: "failed",
        error: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);

    return { runId, status: "failed", error: message };
  }
}

function buildPrompt(params: ExecuteAgentInput): string {
  const now = new Date().toISOString();
  const lines = [
    `Current time: ${now}`,
    `Trigger: ${params.triggerType}${params.triggerSource ? ` (${params.triggerSource})` : ""}`,
  ];
  if (params.input && Object.keys(params.input).length > 0) {
    lines.push(`Input:\n${JSON.stringify(params.input, null, 2)}`);
  }
  lines.push("Execute your role now.");
  return lines.join("\n\n");
}
