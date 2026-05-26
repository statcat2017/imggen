import { expect, type Page } from "@playwright/test";

export const TEST_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAKUlEQVQ4y2P4z0A7YKQdY6QdY6QdY6QdY6QdY6QdY6QdY3oBAAD//8NzI1EAAAAASUVORK5CYII=";

export async function uploadImage(page: Page): Promise<void> {
  const fileChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Upload" }).click();
  await (await fileChooser).setFiles({
    name: "test.png",
    mimeType: "image/png",
    buffer: Buffer.from(TEST_PNG.split(",")[1], "base64"),
  });
  await expect(page.getByText("test.png")).toBeVisible({ timeout: 5000 });
}
