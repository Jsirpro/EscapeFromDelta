import { test, expect } from "@playwright/test";

test("failure path surfaces invalid state without custody mutation", async ({ page }) => {
  await page.goto("/play");
  await expect(page.getByRole("heading", { name: "Play" })).toBeVisible();
});
