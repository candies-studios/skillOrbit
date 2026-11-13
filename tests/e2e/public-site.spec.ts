import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = [
  "/",
  "/courses",
  "/courses/ai-for-everyday-work",
  "/categories",
  "/categories/ai",
  "/instructors",
  "/instructors/meera-iyer",
  "/pricing",
  "/affiliates",
  "/teach",
  "/about",
  "/contact",
  "/faq",
  "/login",
  "/register",
  "/forgot-password",
  "/legal/terms",
  "/legal/privacy",
  "/legal/refunds",
];

for (const path of PAGES) {
  test(`${path} renders without overflow, console errors or serious a11y violations`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    // Static contrast check: don't sample text mid-entrance-animation.
    await page.emulateMedia({ reducedMotion: "reduce" });
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, "horizontal overflow").toBe(false);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

for (const path of ["/courses/does-not-exist", "/categories/nope", "/instructors/nobody"]) {
  test(`${path} returns a real 404`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(404);
    await expect(page.getByText("We couldn’t find that page")).toBeVisible();
  });
}

test("homepage search goes to filtered catalogue", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Search courses" }).fill("seo");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/\/courses\?q=seo/);
  await expect(page.getByRole("link", { name: "SEO That Lasts" })).toBeVisible();
});

test("catalogue filters and invalid params are handled", async ({ page }) => {
  await page.goto("/courses?price=free");
  await expect(page.getByText(/^1 course/)).toBeVisible();
  await page.goto("/courses?category=<script>&sort=evil");
  await expect(page.getByText(/^9 courses/)).toBeVisible();
  await page.goto("/courses?q=zzzz-nothing");
  await expect(page.getByText("No courses match these filters")).toBeVisible();
});

test("sample data is always labelled", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/development samples/)).toBeVisible();
  await page.goto("/courses/ai-for-everyday-work");
  await expect(page.getByText("Sample").first()).toBeVisible();
});

test("register form validates and reports that auth is not connected", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Enter your full name")).toBeVisible();
  await expect(page.getByText("Accept the terms to create an account")).toBeVisible();
  await page.getByLabel("Full name").fill("Asha Patel");
  await page.getByLabel("Email").fill("asha@example.com");
  await page.getByLabel("Password").fill("learning123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Accounts aren’t connected yet")).toBeVisible();
});

test("contact form never claims a message was sent", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Name").fill("Asha Patel");
  await page.getByLabel("Email").fill("asha@example.com");
  await page.getByLabel("Topic").selectOption("course");
  await page.getByLabel("Message").fill("I have a question about the AI course curriculum.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Your message was not sent")).toBeVisible();
});

test("mobile menu opens and navigates", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const nav = page.getByRole("navigation", { name: "Mobile" });
  await expect(nav).toBeVisible();
  await nav.getByRole("link", { name: "Membership" }).click();
  await expect(page).toHaveURL(/\/pricing$/);
  await expect(nav).toBeHidden();
});
