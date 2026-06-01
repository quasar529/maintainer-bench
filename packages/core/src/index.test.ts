import { describe, expect, it } from "vitest";
import { FixtureSchema, RunnerOutputSchema } from "./index.js";

describe("core schemas", () => {
  it("accepts a minimal issue fixture", () => {
    const parsed = FixtureSchema.parse({
      kind: "issue",
      id: "issue-1",
      input: { title: "Bug" },
      expected: { decision: "needs-info" }
    });

    expect(parsed.expected.labels).toEqual([]);
    expect(parsed.input.comments).toEqual([]);
  });

  it("accepts anonymized public OSS provenance", () => {
    const parsed = FixtureSchema.parse({
      kind: "issue",
      id: "issue-with-provenance",
      provenance: {
        inspiredBy: "https://github.com/example/project/issues/1",
        repo: "example/project",
        type: "public-oss-pattern",
        anonymized: true,
        capturedAt: "2026-06-01"
      },
      input: { title: "Bug" },
      expected: { decision: "needs-info" }
    });

    expect(parsed.provenance?.anonymized).toBe(true);
  });

  it("rejects unknown decisions", () => {
    expect(() =>
      RunnerOutputSchema.parse({
        decision: "maybe",
        labels: []
      })
    ).toThrow();
  });
});
