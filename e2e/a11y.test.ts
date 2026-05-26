import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { uploadImage } from "./helpers";

test("empty state has no critical accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});

test("loaded image state has no critical accessibility violations", async ({ page }) => {
  await page.goto("/");
  await uploadImage(page);
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});

test("controls panel has no critical accessibility violations", async ({ page }) => {
  await page.goto("/");
  await uploadImage(page);
  const panelButton = page.getByText("Cell-Shading Controls");
  await panelButton.click();
  await page.waitForTimeout(200);
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});

test("help modal has no critical accessibility violations", async ({ page }) => {
  await page.goto("/");
  const helpButton = page.getByRole("button", { name: "?" });
  await expect(helpButton).toBeVisible();
  await helpButton.click();
  await page.waitForTimeout(200);
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
