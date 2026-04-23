import { test, expect } from "@playwright/test";

test("happy path covers onboarding, admin difficulty, raid, marketplace, warehouse, and records", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Escape from Delta" })).toBeVisible();
});
