import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase before importing the route
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServiceSupabase: vi.fn(async () => ({
    from: mockFrom,
  })),
}));

const { POST } = await import("@/app/api/usage/onboard/route");

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
  return new Request("http://localhost:3000/api/usage/onboard", init);
}

describe("POST /api/usage/onboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-key";
  });

  it("returns 401 when Authorization header is missing", async () => {
    const req = makeRequest({});
    const res = await POST(req as never);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Authorization");
  });

  it("returns 401 when Authorization header does not use Bearer scheme", async () => {
    const req = makeRequest({}, { Authorization: "Basic abc123" });
    const res = await POST(req as never);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Authorization");
  });

  it("returns 401 when token is not found in database", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: null, error: { message: "Not found" } }),
            }),
          }),
        };
      }
      return {};
    });

    const req = makeRequest({}, { Authorization: "Bearer aicamp_invalid" });
    const res = await POST(req as never);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("creates new usage_logs row when none exists for today", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });

    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { id: "user-1" }, error: null }),
            }),
          }),
          update: updateMock,
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

    const req = makeRequest({}, { Authorization: "Bearer aicamp_valid" });
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);

    // Verify insert was called with zeroed usage
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        input_tokens: 0,
        output_tokens: 0,
        sessions_count: 0,
      })
    );
  });

  it("skips insert when usage_logs row already exists for today", async () => {
    const insertMock = vi.fn();
    const updateMock = vi.fn().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });

    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { id: "user-1" }, error: null }),
            }),
          }),
          update: updateMock,
        };
      }
      if (table === "usage_logs") {
        return {
          select: () => ({
            eq: (_col: string, _val: string) => ({
              eq: (_col2: string, _val2: string) => ({
                maybeSingle: () =>
                  Promise.resolve({ data: { id: "existing-log" }, error: null }),
              }),
            }),
          }),
          insert: insertMock,
        };
      }
      return {};
    });

    const req = makeRequest({}, { Authorization: "Bearer aicamp_valid" });
    const res = await POST(req as never);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);

    // Insert should NOT have been called since row already exists
    expect(insertMock).not.toHaveBeenCalled();
  });
});
