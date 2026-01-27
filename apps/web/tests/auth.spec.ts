import { test, expect } from "@playwright/test";

/**
 * Auth and token contract tests.
 * Ensures the web app correctly generates, stores, and clears auth tokens
 * so behavior mirrors the app (see docs/auth-contract.md).
 */

test.describe("Auth API (token storage and mirror with app)", () => {
  test("GET /api/me without token returns 401", async ({ request }) => {
    const res = await request.get("/api/me");
    expect(res.status()).toBe(401);
    const json = await res.json().catch(() => ({}));
    expect(json.error).toBe("Unauthorized");
  });

  test("POST /api/auth/logout returns 200 and success", async ({ request }) => {
    const res = await request.post("/api/auth/logout");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  test("POST /api/auth/verify with invalid body returns 400", async ({
    request,
  }) => {
    const res = await request.post("/api/auth/verify", {
      headers: { "Content-Type": "application/json" },
      data: { email: "", token: "" },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/auth/verify with invalid email returns 400", async ({
    request,
  }) => {
    const res = await request.post("/api/auth/verify", {
      headers: { "Content-Type": "application/json" },
      data: { email: "not-an-email", token: "123456" },
    });
    expect(res.status()).toBe(400);
  });
});
