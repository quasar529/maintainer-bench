import { describe, expect, it } from "vitest";
import { defaultCapturePath, parseGitHubUrl } from "./index.js";

describe("github capture helpers", () => {
  it("parses issue URLs", () => {
    expect(parseGitHubUrl("https://github.com/openai/codex/issues/123")).toEqual({
      owner: "openai",
      repo: "codex",
      kind: "issue",
      number: 123
    });
  });

  it("parses pull request URLs", () => {
    expect(parseGitHubUrl("https://github.com/openai/codex/pull/456")).toEqual({
      owner: "openai",
      repo: "codex",
      kind: "pull_request",
      number: 456
    });
  });

  it("creates a default capture path", () => {
    expect(defaultCapturePath({ owner: "a", repo: "b", kind: "issue", number: 1 })).toBe(
      "fixtures/captured/a-b-issue-1.json"
    );
  });
});
