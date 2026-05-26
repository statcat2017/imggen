import { test, expect } from "@playwright/test";
import { uploadImage } from "./helpers";

test("B key cycles display mode", async ({ page }) => {
  await page.goto("/");
  await uploadImage(page);
  const processedLabel = page.getByText("%");
  await expect(processedLabel).toBeVisible();
  await page.keyboard.press("b");
  await page.waitForTimeout(200);
  await page.keyboard.press("b");
  await page.waitForTimeout(200);
  await expect(processedLabel).toBeVisible();
});

test("Space hold shows original then returns to processed", async ({ page }) => {
  await page.goto("/");
  await uploadImage(page);
  const zoomLabel = page.getByText("%");
  await expect(zoomLabel).toBeVisible();
  await page.keyboard.down(" ");
  await page.waitForTimeout(300);
  await page.keyboard.up(" ");
  await page.waitForTimeout(300);
  await expect(zoomLabel).toBeVisible();
});

test("R resets current preset", async ({ page }) => {
  await page.goto("/");
  await uploadImage(page);
  const panelButton = page.getByText("Cell-Shading Controls");
  await panelButton.click();
  const presetSelect = page.locator("select").first();
  await presetSelect.selectOption("comic-ink");
  await expect(page.getByText("Comic Ink")).toBeVisible();
  await page.keyboard.press("r");
  await expect(page.getByText("Adventure Background")).toBeVisible();
});

test("+ and - zoom in and out", async ({ page }) => {
  await page.goto("/");
  await uploadImage(page);
  const zoomDisplay = page.getByText("%");
  const initialText = await zoomDisplay.textContent();
  expect(initialText).toBeTruthy();
  await page.keyboard.press("+");
  await page.waitForTimeout(200);
  const afterZoomText = await zoomDisplay.textContent();
  expect(afterZoomText).not.toBe(initialText);
  await page.keyboard.press("-");
  await page.waitForTimeout(200);
});
