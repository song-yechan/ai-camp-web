import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase before importing the route
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockEqChain = vi.fn();

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(async () => ({
    from: mockFrom,
  })),
}));

// Must import after vi.mock
const { POST } = await import("@/app/api/usage/submit/route");

function makeRequest(
  body: Record<string, unknown> | null,
  headers: Record<string, string> = {}
) {
  const init: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };
  if (body !== null) {
    init.body = JSON.stringify(body);
  }
  return new Request("http://localhost:3000/api/usage/submit", init);
}

describe("POST /api/usage/submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set required env vars for Supabase client creation
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-key";
  });

  it("returns 401 when Authorization header is missing", async () => {
    const req = makeRequest({ date: "2026-03-21" });
    const res = await POST(req as never);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Authorization");
  });

  it("returns 401 when Authorization header does not start with Bearer", async () => {
    const req = makeRequest({ date: "2026-03-21" }, { Authorization: "Token abc" });
    const res = await POST(req as never);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Authorization");
  });

  it("returns 400 when body is not valid JSON", async () => {
    const req = new Request("http://localhost:3000/api/usage/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer aicamp_test123",
      },
      body: "not-json",
    });
    const res = await POST(req as never);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Invalid JSON");
  });

  it("returns 400 when date field is missing", async () => {
    const req = makeRequest(
      { input_tokens: 100 },
      { Authorization: "Bearer aicamp_test123" }
    );

    // The route tries to parse JSON first, then checks date, before hitting Supabase
    const res = await POST(req as never);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("date");
  });

  it("returns 401 when token is not found in database", async () => {
    // Mock: users query returns no result
    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: { message: "Not found" } }),
            }),
          }),
        };
      }
      return {};
    });

    const req = makeRequest(
      { date: "2026-03-21", input_tokens: 100 },
      { Authorization: "Bearer aicamp_invalid" }
    );
    const res = await POST(req as never);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("inserts new usage log when no existing row found", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { id: "user-1" }, error: null }),
            }),
          }),
        };
      }
      if (table === "usage_logs") {
        return {
          select: () => ({
            eq: (_col: string, _val: string) => ({
              eq: (_col2: string, _val2: string) => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          }),
          insert: insertMock,
        };
      }
      return {};
    });

    const req = makeRequest(
      {
        date: "2026-03-21",
        input_tokens: 1000,
        output_tokens: 500,
        cache_creation_tokens: 200,
        cache_read_tokens: 100,
        total_cost: 0.05,
        commits: 2,
        pull_requests: 1,
      },
      { Authorization: "Bearer aicamp_valid" }
    );
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);

    // Verify insert was called with correct data
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        date: "2026-03-21",
        input_tokens: 1000,
        output_tokens: 500,
        commits: 2,
        pull_requests: 1,
        sessions_count: 1,
      })
    );
  });

  it("updates existing usage log when row exists", async () => {
    const updateMock = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ error: null }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { id: "user-1" }, error: null }),
            }),
          }),
        };
      }
      if (table === "usage_logs") {
        return {
          select: () => ({
            eq: (_col: string, _val: string) => ({
              eq: (_col2: string, _val2: string) => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: {
                      id: "log-1",
                      input_tokens: 500,
                      output_tokens: 200,
                      cache_creation_tokens: 100,
                      cache_read_tokens: 50,
                      total_cost: 0.02,
                      sessions_count: 1,
                      commits: 1,
                      pull_requests: 0,
                    },
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
      {
        date: "2026-03-21",
        input_tokens: 300,
        output_tokens: 100,
        cache_creation_tokens: 50,
        cache_read_tokens: 25,
        total_cost: 0.01,
        commits: 1,
        pull_requests: 1,
      },
      { Authorization: "Bearer aicamp_valid" }
    );
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);

    // Verify update was called with accumulated values
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input_tokens: 800, // 500 + 300
        output_tokens: 300, // 200 + 100
        cache_creation_tokens: 150, // 100 + 50
        cache_read_tokens: 75, // 50 + 25
        sessions_count: 2, // 1 + 1
        commits: 2, // 1 + 1
        pull_requests: 1, // 0 + 1
      })
    );
  });

  it("defaults numeric fields to 0 when not provided", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: { id: "user-1" }, error: null }),
            }),
          }),
        };
      }
      if (table === "usage_logs") {
        return {
          select: () => ({
            eq: (_col: string, _val: string) => ({
              eq: (_col2: string, _val2: string) => ({
                maybeSingle: () => Promise.resolve({ data: null, error: null }),
              }),
            }),
          }),
          insert: insertMock,
        };
      }
      return {};
    });

    const req = makeRequest(
      { date: "2026-03-21" },
      { Authorization: "Bearer aicamp_valid" }
    );
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_tokens: 0,
        cache_read_tokens: 0,
        total_cost: 0,
        commits: 0,
        pull_requests: 0,
      })
    );
  });
});
