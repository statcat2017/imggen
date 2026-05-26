import { test, expect } from "@playwright/test";
import { uploadImage } from "./helpers";

test("upload to first preview under 5 seconds", async ({ page }) => {
  const start = Date.now();
  await page.goto("/");
  await uploadImage(page);
  const elapsed = Date.now() - start;
  expect(elapsed).toBeLessThan(5000);
});

test("slider change to render under 2 seconds", async ({ page }) => {
  await page.goto("/");
  await uploadImage(page);

  const panelButton = page.getByText("Cell-Shading Controls");
  await panelButton.click();
  await page.waitForTimeout(500);

  const slider = page.locator("input[type=range]").first();
  const start = Date.now();
  await slider.fill("0.8");
  await page.waitForTimeout(300);
  const elapsed = Date.now() - start;
  expect(elapsed).toBeLessThan(2000);
});

test("export at preview size triggers download under 10 seconds", async ({ page }) => {
  await page.goto("/");
  await uploadImage(page);

  const downloadPromise = page.waitForEvent("download", { timeout: 10000 });
  const panelButton = page.getByText("Cell-Shading Controls");
  await panelButton.click();

  const formatSelect = page.locator("select").nth(1);
  await formatSelect.selectOption("jpeg");

  const start = Date.now();
  const exportButton = page.getByRole("button", { name: "Export Image" });
  await exportButton.click();

  const download = await downloadPromise;
  const elapsed = Date.now() - start;
  expect(elapsed).toBeLessThan(10000);
  expect(download.suggestedFilename()).toMatch(/\.jpg$/);
});
