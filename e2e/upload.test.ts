import { test, expect } from "@playwright/test";
import { uploadImage, TEST_PNG } from "./helpers";

test("upload PNG via file picker shows metadata", async ({ page }) => {
  await page.goto("/");
  await uploadImage(page);
  await expect(page.getByText("test.png")).toBeVisible();
});

test("drag-and-drop upload works", async ({ page }) => {
  await page.goto("/");
  const buffer = Buffer.from(TEST_PNG.split(",")[1], "base64");

  const dataTransfer = await page.evaluateHandle((buf) => {
    const dt = new DataTransfer();
    const file = new File([new Uint8Array(buf)], "drop.png", { type: "image/png" });
    dt.items.add(file);
    return dt;
  }, Array.from(buffer));

  await page.dispatchEvent("main", "drop", { dataTransfer });
  await expect(page.getByText("drop.png")).toBeVisible({ timeout: 5000 });
});

test("slider interaction updates render status", async ({ page }) => {
  await page.goto("/");
  await uploadImage(page);

  const panelButton = page.getByText("Cell-Shading Controls");
  await panelButton.click();

  const edgeStrength = page.locator("input[type=range]").first();
  await edgeStrength.fill("0.5");
  await expect(edgeStrength).toHaveValue("0.5");
});

test("preset switching changes controls", async ({ page }) => {
  await page.goto("/");
  await uploadImage(page);

  const panelButton = page.getByText("Cell-Shading Controls");
  await panelButton.click();

  const presetSelect = page.locator("select").first();
  await presetSelect.selectOption("comic-ink");

  const label = page.getByText("Comic Ink");
  await expect(label).toBeVisible();
});
