import { test, expect } from "@playwright/test";

/**
 * Critical user flows: redirects for protected routes, public post view.
 * For authenticated flows (e.g. compose with token), use storageState with a valid token cookie.
 */

test.describe("Protected routes redirect unauthenticated users", () => {
  test("compose redirects to landing when not authenticated", async ({
    page,
  }) => {
    await page.goto("/compose", { waitUntil: "commit" });
    await page.waitForURL(/\/(\?.*)?$/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Citewalk" })).toBeVisible();
  });

  test("settings redirects to landing when not authenticated", async ({
    page,
  }) => {
    await page.goto("/settings", { waitUntil: "commit" });
    await page.waitForURL(/\/(\?.*)?$/, { timeout: 10000 });
  });

  test("explore redirects to landing when not authenticated", async ({
    page,
  }) => {
    await page.goto("/explore", { waitUntil: "commit" });
    await page.waitForURL(/\/(\?.*)?$/, { timeout: 10000 });
  });

  test("inbox redirects to landing when not authenticated", async ({
    page,
  }) => {
    await page.goto("/inbox", { waitUntil: "commit" });
    await page.waitForURL(/\/(\?.*)?$/, { timeout: 10000 });
  });

  test("collections redirects to landing when not authenticated", async ({
    page,
  }) => {
    await page.goto("/collections", { waitUntil: "commit" });
    await page.waitForURL(/\/(\?.*)?$/, { timeout: 10000 });
  });
});

test.describe("Public post and user routes are viewable", () => {
  test("post page loads for valid id (may show 404 or content)", async ({
    page,
  }) => {
    await page.goto("/post/1");
    // Should not redirect to sign-in; either post content or not-found state
    await expect(page).not.toHaveURL("/sign-in");
    await expect(page).toHaveURL(/\/post\/1/);
  });

  test("user profile page loads without auth", async ({ page }) => {
    await page.goto("/user/test");
    await expect(page).not.toHaveURL("/sign-in");
    await expect(page).toHaveURL(/\/user\/test/);
  });
});

test.describe("Landing and sign-in", () => {
  test("sign-in page is accessible", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL("/sign-in");
    await expect(
      page.getByRole("heading", { name: /sign in|citewalk/i }),
    ).toBeVisible();
  });
});
