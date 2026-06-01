import path from "node:path";
import type { Fixture } from "@maintainer-bench/core";

export interface GitHubReference {
  owner: string;
  repo: string;
  kind: "issue" | "pull_request";
  number: number;
}

export function parseGitHubUrl(value: string): GitHubReference {
  const url = new URL(value);
  if (url.hostname !== "github.com") {
    throw new Error("Only github.com URLs are supported");
  }

  const [, owner, repo, type, numberText] = url.pathname.split("/");
  const number = Number(numberText);
  if (!owner || !repo || !type || !Number.isInteger(number)) {
    throw new Error(`Unsupported GitHub URL: ${value}`);
  }

  if (type === "issues") {
    return { owner, repo, kind: "issue", number };
  }
  if (type === "pull") {
    return { owner, repo, kind: "pull_request", number };
  }

  throw new Error(`Unsupported GitHub URL type: ${type}`);
}

export function defaultCapturePath(reference: GitHubReference): string {
  const suffix = reference.kind === "issue" ? "issue" : "pr";
  return path.join(
    "fixtures",
    "captured",
    `${reference.owner}-${reference.repo}-${suffix}-${reference.number}.json`
  );
}

export async function captureFromGitHub(reference: GitHubReference): Promise<Fixture> {
  const { Octokit } = await import("@octokit/rest");
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  if (reference.kind === "issue") {
    const issue = await octokit.issues.get({
      owner: reference.owner,
      repo: reference.repo,
      issue_number: reference.number
    });
    const comments = await octokit.issues.listComments({
      owner: reference.owner,
      repo: reference.repo,
      issue_number: reference.number,
      per_page: 50
    });
    const labels = issue.data.labels.map((label) =>
      typeof label === "string" ? label : label.name ?? ""
    ).filter(Boolean);

    return {
      kind: "issue",
      id: `${reference.owner}-${reference.repo}-issue-${reference.number}`,
      input: {
        title: issue.data.title,
        body: issue.data.body ?? "",
        comments: comments.data.map((comment) => comment.body ?? ""),
        currentLabels: labels
      },
      expected: {
        decision: "actionable",
        labels,
        mustAsk: [],
        mustMention: []
      }
    };
  }

  const pull = await octokit.pulls.get({
    owner: reference.owner,
    repo: reference.repo,
    pull_number: reference.number
  });
  const issueComments = await octokit.issues.listComments({
    owner: reference.owner,
    repo: reference.repo,
    issue_number: reference.number,
    per_page: 50
  });
  const files = await octokit.pulls.listFiles({
    owner: reference.owner,
    repo: reference.repo,
    pull_number: reference.number,
    per_page: 100
  });
  const issue = await octokit.issues.get({
    owner: reference.owner,
    repo: reference.repo,
    issue_number: reference.number
  });
  const labels = issue.data.labels.map((label) =>
    typeof label === "string" ? label : label.name ?? ""
  ).filter(Boolean);

  return {
    kind: "pull_request",
    id: `${reference.owner}-${reference.repo}-pr-${reference.number}`,
    input: {
      title: pull.data.title,
      body: pull.data.body ?? "",
      comments: issueComments.data.map((comment) => comment.body ?? ""),
      changedFiles: files.data.map((file) => file.filename),
      patchSummary: summarizePatch(files.data)
    },
    expected: {
      decision: "actionable",
      labels,
      mustAsk: [],
      mustMention: []
    }
  };
}

function summarizePatch(files: Array<{ filename: string; status: string; additions: number; deletions: number; patch?: string }>): string {
  return files
    .map((file) => {
      const patch = file.patch ? `\n${file.patch.slice(0, 2000)}` : "";
      return `File: ${file.filename}\nStatus: ${file.status}\nAdditions: ${file.additions}\nDeletions: ${file.deletions}${patch}`;
    })
    .join("\n\n---\n\n")
    .slice(0, 40_000);
}
