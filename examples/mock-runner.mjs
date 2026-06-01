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

  const lacksReproductionContext = text.includes("all missing") || text.includes("effectively empty");
  const hasEnoughReproduction =
    !lacksReproductionContext &&
    text.includes("minimal reproduction provided") ||
    (!lacksReproductionContext &&
      text.includes("minimal reproduction") &&
      (text.includes("reproduction steps") || text.includes("reproduction repository")));

  if (text.includes("crash") || /\bbug\b/.test(text) || text.includes("404")) labels.push("bug");
  if (hasEnoughReproduction) {
    mentions.push("minimal reproduction provided");
  } else if (text.includes("repro") || text.includes("missing details") || text.includes("effectively empty")) {
    labels.push("needs-repro");
    questions.push("Please provide a minimal reproduction.");
    decision = "needs-info";
  }
  if (text.includes("runtime versions")) {
    questions.push("Please provide the ts-node version.");
    questions.push("Please provide the node version.");
    questions.push("Please provide the TypeScript version.");
  }
  if (text.includes("empty issue template") || (text.includes("issue template") && text.includes("empty"))) {
    mentions.push("empty issue template");
  }
  if (text.includes("spa fallback")) mentions.push("SPA fallback");
  if (text.includes("angular")) mentions.push("Angular");
  if (text.includes("vite")) mentions.push("Vite");
  if (text.includes("static publish")) mentions.push("static publish");
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
    if (text.includes("unsigned")) mentions.push("unsigned token");
    if (text.includes("request-context") || text.includes("request context")) mentions.push("request context");
    if (text.includes("session")) mentions.push("session handling");
    if (text.includes("tests")) mentions.push("tests included");
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
