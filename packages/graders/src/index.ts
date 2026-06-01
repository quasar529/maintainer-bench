import type { Fixture, RunResult } from "@maintainer-bench/core";

export interface GradeResult {
  fixtureId: string;
  kind: Fixture["kind"];
  passed: boolean;
  score: number;
  earnedPoints: number;
  maxPoints: number;
  missing: {
    decision?: string;
    labels: string[];
    mustAsk: string[];
    mustMention: string[];
  };
  noisy: {
    labels: string[];
  };
}

export function gradeFixture(fixture: Fixture, runResult: RunResult): GradeResult {
  const expected = fixture.expected;
  const output = runResult.output;
  let earnedPoints = 0;
  let maxPoints = 1 + expected.labels.length + expected.mustAsk.length + expected.mustMention.length;

  const missing: GradeResult["missing"] = {
    labels: [],
    mustAsk: [],
    mustMention: []
  };

  if (output.decision === expected.decision) {
    earnedPoints += 1;
  } else {
    missing.decision = expected.decision;
  }

  const outputLabels = new Set(output.labels.map(normalizeLabel));
  for (const label of expected.labels) {
    if (outputLabels.has(normalizeLabel(label))) {
      earnedPoints += 1;
    } else {
      missing.labels.push(label);
    }
  }

  const outputText = normalizeText([
    output.summary,
    ...output.questions,
    ...output.mentions,
    ...output.labels
  ].join("\n"));

  for (const item of expected.mustAsk) {
    if (containsNormalized(outputText, item)) {
      earnedPoints += 1;
    } else {
      missing.mustAsk.push(item);
    }
  }

  for (const item of expected.mustMention) {
    if (containsNormalized(outputText, item)) {
      earnedPoints += 1;
    } else {
      missing.mustMention.push(item);
    }
  }

  if (maxPoints === 0) {
    maxPoints = 1;
  }

  const expectedLabels = new Set(expected.labels.map(normalizeLabel));
  const noisyLabels = output.labels.filter((label) => !expectedLabels.has(normalizeLabel(label)));

  return {
    fixtureId: fixture.id,
    kind: fixture.kind,
    passed: earnedPoints === maxPoints,
    score: Number((earnedPoints / maxPoints).toFixed(4)),
    earnedPoints,
    maxPoints,
    missing,
    noisy: {
      labels: noisyLabels
    }
  };
}

export function gradeSuite(fixtures: Fixture[], results: RunResult[]): GradeResult[] {
  const resultById = new Map(results.map((result) => [result.fixtureId, result]));
  return fixtures.map((fixture) => {
    const result = resultById.get(fixture.id);
    if (!result) {
      return missingRunResult(fixture);
    }
    return gradeFixture(fixture, result);
  });
}

function missingRunResult(fixture: Fixture): GradeResult {
  return {
    fixtureId: fixture.id,
    kind: fixture.kind,
    passed: false,
    score: 0,
    earnedPoints: 0,
    maxPoints: 1,
    missing: {
      decision: fixture.expected.decision,
      labels: fixture.expected.labels,
      mustAsk: fixture.expected.mustAsk,
      mustMention: fixture.expected.mustMention
    },
    noisy: { labels: [] }
  };
}

export function renderMarkdownReport(results: GradeResult[]): string {
  const passed = results.filter((result) => result.passed).length;
  const average =
    results.length === 0
      ? 0
      : results.reduce((sum, result) => sum + result.score, 0) / results.length;

  const lines = [
    "# maintainer-bench report",
    "",
    `Passed: ${passed}/${results.length}`,
    `Average score: ${average.toFixed(2)}`,
    "",
    "| Fixture | Kind | Score | Status | Missing | Noisy labels |",
    "| --- | --- | ---: | --- | --- | --- |"
  ];

  for (const result of results) {
    const missing = [
      result.missing.decision ? `decision:${result.missing.decision}` : "",
      ...result.missing.labels.map((label) => `label:${label}`),
      ...result.missing.mustAsk.map((item) => `ask:${item}`),
      ...result.missing.mustMention.map((item) => `mention:${item}`)
    ].filter(Boolean);

    lines.push(
      `| ${result.fixtureId} | ${result.kind} | ${result.score.toFixed(2)} | ${
        result.passed ? "pass" : "fail"
      } | ${escapeCell(missing.join(", ") || "-")} | ${escapeCell(result.noisy.labels.join(", ") || "-")} |`
    );
  }

  return `${lines.join("\n")}\n`;
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._/\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsNormalized(haystack: string, needle: string): boolean {
  return haystack.includes(normalizeText(needle));
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|");
}
