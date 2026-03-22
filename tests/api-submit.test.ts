import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(async () => ({
    from: mockFrom,
  })),
}));

vi.mock("@/lib/badges", () => ({
  checkAndAwardBadges: vi.fn(async () => {}),
}));

const { POST } = await import("@/app/api/usage/submit/route");

function makeRequest(
  body: Record<string, unknown> | null,
  headers: Record<string, string> = {}
) {
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
  };
  if (body !== null) init.body = JSON.stringify(body);
  return new Request("http://localhost:3000/api/usage/submit", init);
}

describe("POST /api/usage/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-key";
  });

  it("returns 401 when Authorization header is missing", async () => {
    const req = makeRequest({ date: "2026-03-21" });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it("returns 400 when date field is missing", async () => {
    const req = makeRequest({ input_tokens: 100 }, { Authorization: "Bearer aicamp_test" });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 401 when token not found", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: "Not found" } }) }) }) };
      }
      return {};
    });

    const req = makeRequest({ date: "2026-03-21", input_tokens: 100 }, { Authorization: "Bearer aicamp_bad" });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it("inserts new row when no existing data", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: "u1" }, error: null }) }) }) };
      }
      if (table === "usage_logs") {
        return { insert: insertMock };
      }
      return {};
    });

    const req = makeRequest(
      { date: "2026-03-21", input_tokens: 1000, output_tokens: 500, commits: 2, pull_requests: 1, total_cost: 0.05 },
      { Authorization: "Bearer aicamp_ok" }
    );
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      user_id: "u1",
      input_tokens: 1000,
      sessions_count: 1,
    }));
  });

  it("updates existing row on unique constraint violation (23505)", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: { code: "23505", message: "unique violation" } });
    const updateMock = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });

    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { id: "u1" }, error: null }) }) }) };
      }
      if (table === "usage_logs") {
        return {
          insert: insertMock,
          select: () => ({
            eq: (_: string, __: string) => ({
              eq: (_: string, __: string) => ({
                single: () => Promise.resolve({
                  data: { id: "log-1", input_tokens: 500, output_tokens: 200, cache_creation_tokens: 0, cache_read_tokens: 0, total_cost: 0.02, sessions_count: 1, commits: 1, pull_requests: 0 },
                  error: null,
                }),
              }),
            }),
          }),
          update: updateMock,
        };
      }
      return {};
    });

    const req = makeRequest(
      { date: "2026-03-21", input_tokens: 300, output_tokens: 100, total_cost: 0.01, commits: 1, pull_requests: 1 },
      { Authorization: "Bearer aicamp_ok" }
    );
    const res = await POST(req as never);
    expect(res.status).toBe(200);

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({
      input_tokens: 800,
      output_tokens: 300,
      sessions_count: 2,
      commits: 2,
      pull_requests: 1,
    }));
  });
});
