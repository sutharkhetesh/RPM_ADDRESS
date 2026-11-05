import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, expect, test } from "@playwright/test";

const origin = "http://127.0.0.1:3107";
const cookieName = "addressly-session";

test("persistent login survives tab and browser restarts, redirects auth pages, and logout revokes it", async ({
  browser,
}) => {
  const profile = await mkdtemp(join(tmpdir(), "rpm-browser-session-"));
  const launch = () =>
    chromium.launchPersistentContext(profile, {
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    });
  let context = await launch();
  try {
    let page = context.pages()[0];
    const email = `persist-${crypto.randomUUID()}@example.test`;
    const password = `Rpm-${crypto.randomUUID()}!`;
    await page.goto(`${origin}/signup`);
    await page
      .getByLabel("Full name", { exact: true })
      .fill("Persistent Customer");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill(password);
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click();
    await expect(page).toHaveURL(`${origin}/dashboard`);
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(`${origin}/login`);
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(`${origin}/dashboard`);
    const cookie = (await context.cookies()).find(
      (c) => c.name === cookieName,
    )!;
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.secure).toBe(true);
    expect(cookie.sameSite).toBe("Lax");
    expect(cookie.path).toBe("/");
    expect(cookie.expires - Date.now() / 1000).toBeGreaterThan(29 * 86400);
    expect(await page.evaluate(() => document.cookie)).not.toContain(
      cookieName,
    );
    await page.reload();
    await expect(page).toHaveURL(`${origin}/dashboard`);
    await page.close();
    page = await context.newPage();
    await page.goto(origin);
    await expect(page).toHaveURL(`${origin}/dashboard`);
    for (const path of ["/signup", "/login"]) {
      await page.goto(`${origin}${path}`);
      await expect(page).toHaveURL(`${origin}/dashboard`);
    }
    await context.close();
    context = await launch();
    page = context.pages()[0];
    await page.goto(origin);
    await expect(page).toHaveURL(`${origin}/dashboard`);
    await expect(
      page.getByRole("heading", { name: "Your dashboard." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(`${origin}/login`);
    expect((await context.cookies()).some((c) => c.name === cookieName)).toBe(
      false,
    );
    // Replay the cookie captured before logout: server-side revocation rejects it.
    const replay = await browser.newContext();
    try {
      await replay.addCookies([cookie]);
      const replayPage = await replay.newPage();
      await replayPage.goto(`${origin}/dashboard`);
      await expect(replayPage).toHaveURL(`${origin}/login`);
    } finally {
      await replay.close();
    }
    await context.close();
    context = await launch();
    page = context.pages()[0];
    await page.goto(`${origin}/dashboard`);
    await expect(page).toHaveURL(`${origin}/login`);
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});

test("missing, forged and browser-expired cookies cannot open protected routes", async ({
  page,
  context,
}) => {
  for (const value of [undefined, "0".repeat(64), "malformed"]) {
    await context.clearCookies();
    if (value)
      await context.addCookies([
        {
          name: cookieName,
          value,
          url: origin,
          httpOnly: true,
          secure: true,
          sameSite: "Lax",
          expires: Math.floor(Date.now() / 1000) + 3600,
        },
      ]);
    await page.goto(`${origin}/dashboard`);
    await expect(page).toHaveURL(`${origin}/login`);
    await page.goto(`${origin}/signup`);
    await expect(page).toHaveURL(`${origin}/signup`);
  }
  await context.addCookies([
    {
      name: cookieName,
      value: "1".repeat(64),
      url: origin,
      expires: Math.floor(Date.now() / 1000) - 1,
    },
  ]);
  await page.goto(`${origin}/dashboard`);
  await expect(page).toHaveURL(`${origin}/login`);
});
