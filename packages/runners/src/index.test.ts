import { describe, expect, it } from "vitest";
import { CommandRunner } from "./index.js";

describe("CommandRunner", () => {
  it("passes fixture JSON on stdin and validates output", async () => {
    const runner = new CommandRunner(process.execPath, [
      "-e",
      "process.stdin.resume();process.stdin.on('data',()=>{});process.stdin.on('end',()=>console.log(JSON.stringify({decision:'needs-info',labels:['bug'],questions:[],mentions:[],summary:''})))"
    ]);

    const output = await runner.run({
      kind: "issue",
      id: "issue-1",
      input: {
        title: "Bug",
        body: "",
        comments: [],
        currentLabels: []
      },
      expected: {
        decision: "needs-info",
        labels: [],
        mustAsk: [],
        mustMention: []
      }
    });

    expect(output.decision).toBe("needs-info");
    expect(output.labels).toEqual(["bug"]);
  });
});
