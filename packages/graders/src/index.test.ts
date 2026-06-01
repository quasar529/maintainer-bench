import { describe, expect, it } from "vitest";
import type { Fixture, RunResult } from "@maintainer-bench/core";
import { gradeFixture, renderMarkdownReport } from "./index.js";

describe("graders", () => {
  const fixture: Fixture = {
    kind: "issue",
    id: "issue-1",
    input: {
      title: "Crash",
      body: "",
      comments: [],
      currentLabels: []
    },
    expected: {
      decision: "needs-info",
      labels: ["bug", "needs-repro"],
      mustAsk: ["minimal reproduction"],
      mustMention: ["config file path"]
    }
  };

  it("grades deterministic expected items", () => {
    const result: RunResult = {
      fixtureId: "issue-1",
      kind: "issue",
      startedAt: "2026-01-01T00:00:00.000Z",
      completedAt: "2026-01-01T00:00:00.000Z",
      output: {
        decision: "needs-info",
        labels: ["bug"],
        questions: ["Can you provide a minimal reproduction?"],
        mentions: ["The config file path is missing."],
        summary: ""
      }
    };

    const grade = gradeFixture(fixture, result);
    expect(grade.passed).toBe(false);
    expect(grade.missing.labels).toEqual(["needs-repro"]);
    expect(grade.score).toBe(0.8);
  });

  it("renders markdown", () => {
    const report = renderMarkdownReport([
      {
        fixtureId: "issue-1",
        kind: "issue",
        passed: true,
        score: 1,
        earnedPoints: 1,
        maxPoints: 1,
        missing: { labels: [], mustAsk: [], mustMention: [] },
        noisy: { labels: [] }
      }
    ]);

    expect(report).toContain("Passed: 1/1");
  });
});
