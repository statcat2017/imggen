import { test, expect } from "@playwright/test";
import { uploadImage } from "./helpers";

test("export button triggers PNG download", async ({ page }) => {
  await page.goto("/");
  await uploadImage(page);

  const downloadPromise = page.waitForEvent("download");
  const panelButton = page.getByText("Cell-Shading Controls");
  await panelButton.click();

  const exportSection = page.getByText("Export").nth(0);
  await exportSection.click();

  const exportButton = page.getByRole("button", { name: "Export Image" });
  await exportButton.click();

  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.(png|jpg)$/);
});

test("E shortcut focuses export panel", async ({ page }) => {
  await page.goto("/");
  await uploadImage(page);
  await page.keyboard.press("e");
  await page.waitForTimeout(200);
  const exportSection = page.getByText("Export").first();
  await expect(exportSection).toBeVisible();
});

test("help modal opens via ? button", async ({ page }) => {
  await page.goto("/");
  const helpButton = page.getByRole("button", { name: "?" });
  await expect(helpButton).toBeVisible();
  await helpButton.click();
  const dialog = page.getByRole("dialog", { name: "Keyboard Shortcuts" });
  await expect(dialog).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});
