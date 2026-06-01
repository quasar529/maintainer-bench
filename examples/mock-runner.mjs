#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const fixture = JSON.parse(input);
  const text = [
    fixture.input.title,
    fixture.input.body,
    ...(fixture.input.comments ?? []),
    fixture.input.patchSummary ?? "",
    ...(fixture.input.changedFiles ?? [])
  ]
    .join("\n")
    .toLowerCase();

  const labels = [];
  const questions = [];
  const mentions = [];
  let decision = "actionable";

  if (text.includes("crash")) labels.push("bug");
  if (text.includes("repro") || text.includes("missing details")) {
    labels.push("needs-repro");
    questions.push("Please provide a minimal reproduction.");
    decision = "needs-info";
  }
  if (text.includes("auth middleware") || text.includes("without adding tests") || text.includes("no tests")) {
    labels.push("needs-tests");
    mentions.push("auth middleware");
    mentions.push("missing tests");
    decision = "blocked";
  }
  if (text.includes("docs")) labels.push("documentation");
  if (text.includes("security") || text.includes("token")) {
    labels.push("security");
    mentions.push("security-sensitive change");
    if (text.includes("token values")) {
      decision = "blocked";
      mentions.push("token values");
    }
  }

  console.log(
    JSON.stringify({
      decision,
      labels,
      questions,
      mentions,
      summary: `Mock maintainer decision for ${fixture.id}.`
    })
  );
});
