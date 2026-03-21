import { describe, it, expect } from "vitest";

describe("hook script content — commit/PR tracking", () => {
  let script: string;

  // Fetch script once for all tests
  beforeAll(async () => {
    const { GET } = await import("@/app/api/hook-script/route");
    const response = await GET();
    script = await response.text();
  });

  it("contains git commit detection regex", () => {
    // The script should detect `git commit` commands in Bash tool calls
    expect(script).toContain("git");
    expect(script).toContain("commit");
    // Check for the regex pattern that matches git commit
    expect(script).toMatch(/git\\s\+commit|git\\\\s\+commit/);
  });

  it("contains gh pr create detection regex", () => {
    // The script should detect `gh pr create` commands
    expect(script).toContain("gh");
    expect(script).toContain("pr");
    // Check for the regex pattern that matches gh pr create
    expect(script).toMatch(/gh\\s\+pr\\s\+create|gh\\\\s\+pr\\\\s\+create/);
  });

  it("tracks commits count in the payload", () => {
    // The JSON payload sent to the server should include commits
    expect(script).toContain("commits:");
    expect(script).toContain("commits");
  });

  it("tracks pull_requests count in the payload", () => {
    // The JSON payload should include pull_requests
    expect(script).toContain("pull_requests:");
    expect(script).toContain("pull_requests");
  });

  it("sends commits and pull_requests in JSON.stringify payload", () => {
    // Verify commits and pull_requests are part of the data object
    // that gets JSON.stringified and sent to /api/usage/submit
    expect(script).toContain("JSON.stringify");
    expect(script).toContain("/api/usage/submit");

    // Find the JSON.stringify that builds the submission data (contains "date:")
    // There are multiple JSON.stringify calls; we need the one with the submission payload
    const dataPattern = /JSON\.stringify\(\{[\s\S]*?\}\)/g;
    const matches = script.match(dataPattern);
    expect(matches).not.toBeNull();

    // Find the match that contains "date:" — that's the submission payload
    const submissionPayload = matches!.find((m) => m.includes("date:"));
    expect(submissionPayload).toBeDefined();
    expect(submissionPayload).toContain("commits");
    expect(submissionPayload).toContain("pull_requests");
  });

  it("initializes commits and pullRequests counters to 0", () => {
    expect(script).toContain("let commits = 0");
    expect(script).toContain("let pullRequests = 0");
  });

  it("increments counters when git commit / gh pr create detected", () => {
    expect(script).toContain("commits++");
    expect(script).toContain("pullRequests++");
  });

  it("detects tool_use blocks with Bash name", () => {
    // The script should look for tool_use blocks with name "Bash"
    expect(script).toContain('block.name === "Bash"');
    expect(script).toContain("tool_use");
  });
});

import { beforeAll } from "vitest";
