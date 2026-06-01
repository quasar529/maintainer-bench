#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { Command } from "commander";
import {
  defaultGradeResultsPath,
  defaultReportPath,
  defaultRunResultsPath,
  loadConfig,
  loadFixture,
  loadRunResults,
  loadSuite,
  writeJsonFile,
  type Fixture
} from "@maintainer-bench/core";
import { captureFromGitHub, defaultCapturePath, parseGitHubUrl } from "@maintainer-bench/github-capture";
import { gradeSuite, renderMarkdownReport } from "@maintainer-bench/graders";
import { createRunner, runSuite } from "@maintainer-bench/runners";

const program = new Command();

program
  .name("maintainer-bench")
  .description("Repo-local regression tests for AI-assisted maintainer decisions.")
  .version("0.1.0");

const capture = program.command("capture").description("Capture GitHub issues or PRs as editable fixtures.");

capture
  .command("issue")
  .argument("<github-url>")
  .option("-o, --out <path>", "fixture output path")
  .action(async (githubUrl: string, options: { out?: string }) => {
    await captureFixture(githubUrl, "issue", options.out);
  });

capture
  .command("pr")
  .argument("<github-url>")
  .option("-o, --out <path>", "fixture output path")
  .action(async (githubUrl: string, options: { out?: string }) => {
    await captureFixture(githubUrl, "pull_request", options.out);
  });

program
  .command("suggest-baseline")
  .argument("<fixture-path>")
  .option("-c, --config <path>", "config file path", ".maintainer-bench.json")
  .description("Run the configured runner and write its output as the fixture expected baseline.")
  .action(async (fixturePath: string, options: { config: string }) => {
    const config = await loadConfig(options.config);
    const fixture = await loadFixture(fixturePath);
    const runner = createRunner(config.runner);
    const output = await runner.run(fixture);
    const updated: Fixture = {
      ...fixture,
      expected: {
        decision: output.decision ?? fixture.expected.decision,
        labels: output.labels,
        mustAsk: output.questions,
        mustMention: output.mentions
      }
    };
    await writeJsonFile(fixturePath, updated);
    console.log(`Updated baseline: ${fixturePath}`);
  });

program
  .command("run")
  .option("-s, --suite <path>", "suite path")
  .option("-c, --config <path>", "config file path", ".maintainer-bench.json")
  .option("-o, --out <path>", "run result output path")
  .description("Run the configured maintainer decision runner against a fixture suite.")
  .action(async (options: { suite?: string; config: string; out?: string }) => {
    const config = await loadConfig(options.config);
    const loaded = await loadSuite(options.suite ?? config.suitePath);
    const results = await runSuite(
      loaded.map((item) => item.fixture),
      createRunner(config.runner)
    );
    const outPath = options.out ?? defaultRunResultsPath(config.outputPath);
    await writeJsonFile(outPath, results);
    console.log(`Wrote ${results.length} run results: ${outPath}`);
  });

program
  .command("grade")
  .option("-s, --suite <path>", "suite path")
  .option("-c, --config <path>", "config file path", ".maintainer-bench.json")
  .option("-r, --results <path>", "run results path")
  .option("-o, --out <path>", "grade result output path")
  .option("--fail-on-failures", "exit with code 1 when any fixture fails", false)
  .description("Grade run results against fixture expected outputs.")
  .action(async (options: { suite?: string; config: string; results?: string; out?: string; failOnFailures: boolean }) => {
    const config = await loadConfig(options.config);
    const loaded = await loadSuite(options.suite ?? config.suitePath);
    const results = await loadRunResults(options.results ?? defaultRunResultsPath(config.outputPath));
    const grades = gradeSuite(
      loaded.map((item) => item.fixture),
      results
    );
    const outPath = options.out ?? defaultGradeResultsPath(config.outputPath);
    await writeJsonFile(outPath, grades);
    const failures = grades.filter((grade) => !grade.passed).length;
    console.log(`Wrote ${grades.length} grade results: ${outPath}`);
    if (options.failOnFailures && failures > 0) {
      process.exitCode = 1;
    }
  });

program
  .command("report")
  .option("-c, --config <path>", "config file path", ".maintainer-bench.json")
  .option("-g, --grades <path>", "grade results path")
  .option("-o, --out <path>", "report output path")
  .option("--fail-on-failures", "exit with code 1 when any fixture failed", false)
  .description("Render a Markdown report from grade results.")
  .action(async (options: { config: string; grades?: string; out?: string; failOnFailures: boolean }) => {
    const config = await loadConfig(options.config);
    const gradesPath = options.grades ?? defaultGradeResultsPath(config.outputPath);
    const grades = JSON.parse(await fs.readFile(gradesPath, "utf8"));
    const report = renderMarkdownReport(grades);
    const outPath = options.out ?? defaultReportPath(config.outputPath);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, report);
    console.log(report);
    console.log(`Wrote report: ${outPath}`);
    if (options.failOnFailures && grades.some((grade: { passed: boolean }) => !grade.passed)) {
      process.exitCode = 1;
    }
  });

program.parseAsync().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function captureFixture(
  githubUrl: string,
  expectedKind: "issue" | "pull_request",
  outPath?: string
): Promise<void> {
  const reference = parseGitHubUrl(githubUrl);
  if (reference.kind !== expectedKind) {
    throw new Error(`Expected a ${expectedKind} URL, got ${reference.kind}`);
  }
  const fixture = await captureFromGitHub(reference);
  const targetPath = outPath ?? defaultCapturePath(reference);
  await writeJsonFile(targetPath, fixture);
  console.log(`Wrote fixture: ${targetPath}`);
}
