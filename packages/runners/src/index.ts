import { spawn } from "node:child_process";
import type { Fixture, RunResult, RunnerConfig, RunnerOutput } from "@maintainer-bench/core";
import { RunnerOutputSchema } from "@maintainer-bench/core";

export interface Runner {
  run(fixture: Fixture): Promise<RunnerOutput>;
}

export function createRunner(config: RunnerConfig): Runner {
  if (config.type === "command") {
    return new CommandRunner(config.command, config.args, config.timeoutMs);
  }
  return new OpenAIRunner(config.model, config.prompt);
}

export async function runSuite(fixtures: Fixture[], runner: Runner): Promise<RunResult[]> {
  const results: RunResult[] = [];

  for (const fixture of fixtures) {
    const startedAt = new Date().toISOString();
    const output = await runner.run(fixture);
    const completedAt = new Date().toISOString();
    results.push({
      fixtureId: fixture.id,
      kind: fixture.kind,
      output,
      startedAt,
      completedAt
    });
  }

  return results;
}

export class CommandRunner implements Runner {
  constructor(
    private readonly command: string,
    private readonly args: string[] = [],
    private readonly timeoutMs = 60_000
  ) {}

  async run(fixture: Fixture): Promise<RunnerOutput> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.command, this.args, {
        stdio: ["pipe", "pipe", "pipe"],
        env: process.env
      });

      let stdout = "";
      let stderr = "";
      const timeout = setTimeout(() => {
        child.kill("SIGTERM");
        reject(new Error(`Command runner timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk;
      });
      child.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.on("close", (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          reject(new Error(`Command runner exited with ${code}: ${stderr.trim()}`));
          return;
        }

        try {
          resolve(RunnerOutputSchema.parse(JSON.parse(stdout)));
        } catch (error) {
          reject(new Error(`Command runner returned invalid JSON: ${(error as Error).message}`));
        }
      });

      child.stdin.end(`${JSON.stringify(fixture)}\n`);
    });
  }
}

export class OpenAIRunner implements Runner {
  constructor(
    private readonly model: string,
    private readonly prompt?: string
  ) {}

  async run(fixture: Fixture): Promise<RunnerOutput> {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI();
    const response = await client.responses.create({
      model: this.model,
      input: [
        {
          role: "system",
          content:
            this.prompt ??
            "You are evaluating OSS maintainer workflow decisions. Return only JSON with decision, labels, questions, mentions, and summary."
        },
        {
          role: "user",
          content: JSON.stringify(fixture, null, 2)
        }
      ]
    });

    const text = response.output_text;
    if (!text) {
      throw new Error("OpenAI runner returned no output_text");
    }

    return RunnerOutputSchema.parse(JSON.parse(stripJsonFence(text)));
  }
}

function stripJsonFence(value: string): string {
  return value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
}
