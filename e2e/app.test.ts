import { test, expect } from "@playwright/test";

test("app loads and shows upload zone", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("imggen")).toBeVisible();
  await expect(page.getByText("Upload a PNG or JPG")).toBeVisible();
});

test("upload button opens file picker", async ({ page }) => {
  await page.goto("/");
  const uploadButton = page.getByRole("button", { name: "Upload" });
  await expect(uploadButton).toBeVisible();
});

test("rejects unsupported file type with error", async ({ page }) => {
  await page.goto("/");

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Upload" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: "test.gif",
    mimeType: "image/gif",
    buffer: Buffer.from("fake-gif-data"),
  });

  await expect(page.getByText("That file type is not supported")).toBeVisible();
});

test("toolbar shows export button when loaded", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Export" })).toBeVisible();
});
