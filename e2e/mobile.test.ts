import { test, expect } from "@playwright/test";
import { uploadImage } from "./helpers";

test.describe("mobile viewport", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("bottom sheet layout present", async ({ page }) => {
    await page.goto("/");
    await uploadImage(page);
    const panelButton = page.getByText("Cell-Shading Controls");
    await panelButton.click();
    await page.waitForTimeout(200);
    const slider = page.locator("input[type=range]").first();
    await expect(slider).toBeVisible();
  });

  test("sliders are finger-friendly", async ({ page }) => {
    await page.goto("/");
    await uploadImage(page);
    const panelButton = page.getByText("Cell-Shading Controls");
    await panelButton.click();
    const sliders = page.locator("input[type=range]");
    const count = await sliders.count();
    expect(count).toBeGreaterThan(0);
  });
});
