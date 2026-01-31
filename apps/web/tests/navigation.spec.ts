import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should navigate to the explore page", async ({ page }) => {
    await page.goto("/");

    // Check if we are on the landing page
    await expect(page.getByRole("heading", { name: "Citewalk" })).toBeVisible();

    // Verify "Sign In" link exists
    const signInLink = page.getByRole("link", { name: "Sign in" });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute("href", "/sign-in");
  });

  test("should redirect unauthenticated user from protected route", async ({
    page,
  }) => {
    // Try to access the home feed directly without logging in
    await page.goto("/home");

    // Should be redirected to landing page or sign-in
    // Based on middleware logic, it redirects to '/'
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Citewalk" })).toBeVisible();
  });

  test("should display footer links", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Privacy" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Terms" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Imprint" })).toBeVisible();
  });
});
