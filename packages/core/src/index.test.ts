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

  it("rejects unknown decisions", () => {
    expect(() =>
      RunnerOutputSchema.parse({
        decision: "maybe",
        labels: []
      })
    ).toThrow();
  });
});
