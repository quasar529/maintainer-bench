import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";

export const DecisionSchema = z.enum(["actionable", "needs-info", "duplicate", "invalid", "blocked"]);
export type Decision = z.infer<typeof DecisionSchema>;

export const ExpectedSchema = z.object({
  decision: DecisionSchema,
  labels: z.array(z.string()).default([]),
  mustAsk: z.array(z.string()).default([]),
  mustMention: z.array(z.string()).default([])
});
export type Expected = z.infer<typeof ExpectedSchema>;

export const IssueFixtureSchema = z.object({
  kind: z.literal("issue"),
  id: z.string().min(1),
  input: z.object({
    title: z.string(),
    body: z.string().default(""),
    comments: z.array(z.string()).default([]),
    currentLabels: z.array(z.string()).default([])
  }),
  expected: ExpectedSchema
});

export const PullRequestFixtureSchema = z.object({
  kind: z.literal("pull_request"),
  id: z.string().min(1),
  input: z.object({
    title: z.string(),
    body: z.string().default(""),
    comments: z.array(z.string()).default([]),
    changedFiles: z.array(z.string()).default([]),
    patchSummary: z.string().default("")
  }),
  expected: ExpectedSchema
});

export const FixtureSchema = z.discriminatedUnion("kind", [IssueFixtureSchema, PullRequestFixtureSchema]);
export type Fixture = z.infer<typeof FixtureSchema>;

export const RunnerOutputSchema = z.object({
  decision: DecisionSchema.optional(),
  labels: z.array(z.string()).default([]),
  questions: z.array(z.string()).default([]),
  mentions: z.array(z.string()).default([]),
  summary: z.string().default("")
});
export type RunnerOutput = z.infer<typeof RunnerOutputSchema>;

export const RunResultSchema = z.object({
  fixtureId: z.string(),
  kind: z.enum(["issue", "pull_request"]),
  output: RunnerOutputSchema,
  startedAt: z.string(),
  completedAt: z.string()
});
export type RunResult = z.infer<typeof RunResultSchema>;

export const RunnerConfigSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("command"),
    command: z.string().min(1),
    args: z.array(z.string()).default([]),
    timeoutMs: z.number().int().positive().default(60_000)
  }),
  z.object({
    type: z.literal("openai"),
    model: z.string().min(1),
    prompt: z.string().optional()
  })
]);
export type RunnerConfig = z.infer<typeof RunnerConfigSchema>;

export const BenchConfigSchema = z.object({
  suitePath: z.string().default("fixtures"),
  outputPath: z.string().default(".maintainer-bench/results"),
  runner: RunnerConfigSchema.default({
    type: "command",
    command: "node",
    args: ["examples/mock-runner.mjs"],
    timeoutMs: 60_000
  })
});
export type BenchConfig = z.infer<typeof BenchConfigSchema>;

export async function readJsonFile<T>(filePath: string, schema: z.ZodType<T>): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  return schema.parse(parsed);
}

export async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function loadConfig(configPath = ".maintainer-bench.json"): Promise<BenchConfig> {
  try {
    return await readJsonFile(configPath, BenchConfigSchema);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return BenchConfigSchema.parse({});
    }
    throw error;
  }
}

export async function loadFixture(filePath: string): Promise<Fixture> {
  return readJsonFile(filePath, FixtureSchema);
}

export async function loadRunResults(filePath: string): Promise<RunResult[]> {
  return readJsonFile(filePath, z.array(RunResultSchema));
}

export async function loadSuite(suitePath: string): Promise<Array<{ filePath: string; fixture: Fixture }>> {
  const absolute = path.resolve(suitePath);
  const stat = await fs.stat(absolute);
  const files = stat.isDirectory() ? await collectJsonFiles(absolute) : [absolute];
  const fixtures = [];

  for (const filePath of files) {
    fixtures.push({ filePath, fixture: await loadFixture(filePath) });
  }

  fixtures.sort((a, b) => a.fixture.id.localeCompare(b.fixture.id));
  return fixtures;
}

async function collectJsonFiles(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsonFiles(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(entryPath);
    }
  }

  return files;
}

export function defaultRunResultsPath(outputPath: string): string {
  return path.join(outputPath, "run-results.json");
}

export function defaultGradeResultsPath(outputPath: string): string {
  return path.join(outputPath, "grade-results.json");
}

export function defaultReportPath(outputPath: string): string {
  return path.join(outputPath, "report.md");
}
