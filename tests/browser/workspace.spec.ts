import { readFile } from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";
function account(name = "Aarav Sharma") {
  return {
    name,
    email: `user-${crypto.randomUUID()}@example.test`,
    password: `Rpm-${crypto.randomUUID()}!`,
  };
}
async function signup(
  page: Page,
  user: ReturnType<typeof account>,
  openSetup = true,
) {
  await page.goto("/signup");
  await page
    .getByRole("textbox", { name: "Full name", exact: true })
    .fill(user.name);
  await page.getByLabel("Email address").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByLabel("Confirm password").fill(user.password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Your dashboard." }),
  ).toBeVisible();
  if (openSetup) {
    await page.goto("/onboarding");
    await expect(
      page.getByRole("heading", { name: "Add your shipping address" }),
    ).toBeVisible();
  }
}
async function fillAddress(
  page: Page,
  street = "12 Shipping Road",
  city = "Mumbai",
  state = "Maharashtra",
  pin = "400001",
) {
  await page.getByLabel("Mobile number").fill("9876543210");
  await page
    .getByRole("textbox", { name: "Address line 1", exact: true })
    .fill(street);
  await page.getByLabel(/^City/).fill(city);
  await page.getByLabel("State / province").fill(state);
  await page.getByLabel("Postal / PIN code").fill(pin);
}
async function sameAddressSetup(page: Page) {
  await fillAddress(page);
  await page.getByRole("button", { name: "Continue to billing" }).click();
  await expect(
    page.getByRole("heading", { name: "Add your billing address" }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: /Same as Shipping Address/ })
    .check();
  await page
    .getByRole("button", { name: "Save addresses", exact: true })
    .click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Your dashboard." }),
  ).toBeVisible();
}

test("signup → copied shipping/billing → dashboard, CRUD, print, PDF and ownership", async ({
  page,
  browser,
}) => {
  const user = account();
  await page.goto("/");
  await expect(page).toHaveURL(/signup/);
  await signup(page, user);
  await expect(
    page.getByRole("textbox", { name: "Full name", exact: true }),
  ).toHaveValue(user.name);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/dashboard/);
  await page.goto("/onboarding");
  await fillAddress(page);
  await page.getByRole("button", { name: "Continue to billing" }).click();
  await page
    .getByRole("checkbox", { name: /Same as Shipping Address/ })
    .check();
  await expect(
    page.getByRole("textbox", { name: "Address line 1", exact: true }),
  ).toHaveValue("12 Shipping Road");
  await expect(
    page.getByRole("textbox", { name: "Address line 1", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Back to shipping" }).click();
  await page
    .getByRole("textbox", { name: "Address line 1", exact: true })
    .fill("14 Shipping Road");
  await page.getByRole("button", { name: "Continue to billing" }).click();
  await expect(
    page.getByRole("textbox", { name: "Address line 1", exact: true }),
  ).toHaveValue("14 Shipping Road");
  await page
    .getByRole("button", { name: "Save addresses", exact: true })
    .click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Your dashboard." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Branches", exact: true }),
  ).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/dashboard/);
  await page.goto("/addresses");
  await expect(page.locator(".table-wrap tbody tr")).toHaveCount(2);
  await page.getByRole("button", { name: "Shipping", exact: true }).click();
  await expect(page).toHaveURL(/filter=shipping/);
  await expect(page.locator(".table-wrap tbody tr")).toHaveCount(1);
  await page.getByLabel("Search addresses").fill("NoMatch12345");
  await expect(
    page.getByRole("heading", { name: "No addresses found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.locator(".table-wrap tbody tr")).toHaveCount(1);
  await page
    .getByRole("link", { name: `Edit ${user.name}`, exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/addresses\/[a-f0-9-]+\/edit/);
  const id = page.url().split("/").at(-2)!;
  await page.getByLabel(/^City/).fill("Pune");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByText("Pune, Maharashtra · 400001", { exact: true }).first(),
  ).toBeVisible();
  await page.goto(`/addresses/${id}/print`);
  await expect(page.getByText("SHIP TO:", { exact: true })).toBeVisible();
  await page.getByLabel("Paper format").selectOption("shipping");
  await page.getByLabel("Address purpose").selectOption("billing");
  await expect(page.getByText("BILL TO:", { exact: true })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PDF" }).click();
  const pdf = await download;
  expect(pdf.suggestedFilename()).toBe("address-aarav-sharma-billing.pdf");
  expect((await readFile((await pdf.path())!)).subarray(0, 5).toString()).toBe(
    "%PDF-",
  );
  await page.emulateMedia({ media: "print" });
  await expect(
    page.getByRole("button", { name: "Print address" }),
  ).toBeHidden();
  await page.emulateMedia({ media: "screen" });
  const other = await browser.newContext(),
    otherPage = await other.newPage();
  await signup(otherPage, account("Another Customer"));
  await sameAddressSetup(otherPage);
  await otherPage.goto(`/addresses/${id}/edit`);
  await expect(
    otherPage.getByRole("heading", { name: "Address not found." }),
  ).toBeVisible();
  await otherPage.goto(`/addresses/${id}/print`);
  await expect(
    otherPage.getByRole("heading", { name: "Address not found." }),
  ).toBeVisible();
  await other.close();
  await page.goto("/addresses?filter=shipping");
  await page
    .getByRole("button", { name: `Delete ${user.name}`, exact: true })
    .first()
    .click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep address" }).click();
  await page
    .getByRole("button", { name: `Delete ${user.name}`, exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Delete address", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "No addresses found" }),
  ).toBeVisible();
  await page.goto("/addresses");
  await expect(page.locator(".table-wrap tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await page.getByLabel("Email address").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
});

test("mobile signup, different billing address, validation and responsive navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const user = account("Mobile Customer");
  await signup(page, user);
  await fillAddress(page);
  await page.getByRole("button", { name: "Continue to billing" }).click();
  await page
    .getByRole("button", { name: "Save addresses", exact: true })
    .click();
  await expect(page).toHaveURL(/onboarding/);
  await expect(
    page.getByRole("heading", { name: "Add your billing address" }),
  ).toBeVisible();
  await fillAddress(page, "24 Billing Road", "Delhi", "Delhi", "110006");
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/onboarding-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Save addresses", exact: true })
    .click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto("/addresses");
  await expect(page.locator(".address-card")).toHaveCount(2);
  await expect(
    page.getByText("24 Billing Road", { exact: false }).last(),
  ).toBeVisible();
  await expect(
    page.getByText("12 Shipping Road", { exact: false }).last(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close navigation" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/addresses-mobile.png",
    fullPage: true,
  });
});

test("confirmation validation and users without addresses reach the dashboard on login", async ({
  page,
}) => {
  const user = account("Returning Customer");
  await page.goto("/signup");
  await page
    .getByRole("textbox", { name: "Full name", exact: true })
    .fill(user.name);
  await page.getByLabel("Email address").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByLabel("Confirm password").fill("Mismatch-password-123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Passwords do not match");
  await page.getByLabel("Confirm password").fill(user.password);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/dashboard/);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await page.getByLabel("Email address").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Your dashboard." }),
  ).toBeVisible();
});

test("signup opens the dashboard and allows adding the first address directly", async ({
  page,
}) => {
  const user = account("Direct Signup Customer");
  await signup(page, user, false);
  await expect(
    page.getByRole("heading", { name: "Your dashboard." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your next destination starts here." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Add address", exact: true }).click();
  await expect(page).toHaveURL(/addresses\/new/);
  await page
    .getByRole("textbox", { name: "Full name", exact: true })
    .fill(user.name);
  await fillAddress(page);
  await page.getByLabel("Address type").selectOption("SHIPPING");
  await page.getByRole("button", { name: "Save address", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator(".table-wrap tbody tr")).toHaveCount(1);
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Your dashboard." }),
  ).toBeVisible();
});

test("authentication messages identify incorrect passwords and existing accounts", async ({
  page,
}) => {
  const user = account("Authentication Customer");
  await signup(page, user, false);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await page.getByLabel("Email address").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Incorrect password. Please try again.",
  );
  await page
    .getByLabel("Email address")
    .fill(`missing-${crypto.randomUUID()}@example.test`);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText(
    "No account found with this email. Please sign up.",
  );
  await page.goto("/signup");
  await page
    .getByRole("textbox", { name: "Full name", exact: true })
    .fill(user.name);
  await page.getByLabel("Email address").fill(user.email.toUpperCase());
  const otherPassword = `Other-${crypto.randomUUID()}!`;
  await page.getByLabel("Password", { exact: true }).fill(otherPassword);
  await page.getByLabel("Confirm password").fill(otherPassword);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText(
    "An account with this email already exists. Please sign in.",
  );
  await expect(page).toHaveURL(/signup/);
  await page.goto("/login");
  await page.getByLabel("Email address").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
});

test("theme-aware login design, password visibility and sidebar without account card", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Welcome back.", exact: true }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/light/);
  const password = page.getByLabel("Password", { exact: true });
  await password.fill("Visibility-test-123!");
  await page
    .getByRole("button", { name: "Show password", exact: true })
    .click();
  await expect(password).toHaveAttribute("type", "text");
  await page
    .getByRole("button", { name: "Hide password", exact: true })
    .click();
  await expect(password).toHaveAttribute("type", "password");
  await expect(page.locator(".auth-header")).toHaveCount(0);
  await expect(page.locator(".auth-footer")).toHaveCount(0);
  const logo = page.locator(".auth-form-brand .rpm-logo-crop img");
  await expect(logo).toBeVisible();
  await expect(logo).toHaveJSProperty("complete", true);
  expect(await logo.evaluate((el) => getComputedStyle(el).mixBlendMode)).toBe(
    "multiply",
  );
  await page.screenshot({
    path: "test-results/login-light-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Toggle light and dark mode" })
    .click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  expect(await logo.evaluate((el) => getComputedStyle(el).filter)).toContain(
    "invert(1)",
  );
  expect(await logo.evaluate((el) => getComputedStyle(el).mixBlendMode)).toBe(
    "screen",
  );
  expect(
    await page
      .locator(".rpm-logo-crop")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).toBe("rgba(0, 0, 0, 0)");
  await page.screenshot({
    path: "test-results/login-dark-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".auth-hero")).toBeHidden();
  await expect(
    page.getByRole("img", { name: "RPM Eyewear", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/login-dark-mobile.png",
    fullPage: true,
  });
  await signup(page, account("UI Review Customer"), false);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator(".sidebar .workspace-label")).toHaveCount(0);
  await expect(
    page.locator(".sidebar").getByText("Your account", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/dashboard-clean-sidebar.png",
    fullPage: true,
  });
});

test("overview lists all addresses and keeps shipping and billing navigation", async ({
  page,
}) => {
  await signup(page, account("Overview Customer"));
  await sameAddressSetup(page);
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(
    nav.getByRole("link", { name: "All addresses", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Recently added" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Your address book" }),
  ).toBeVisible();
  await expect(page.locator(".table-wrap tbody tr")).toHaveCount(2);
  await page.getByLabel("Search addresses").fill("NoMatchOverview123");
  await expect(page).toHaveURL(/dashboard\?q=NoMatchOverview123/);
  await expect(
    page.getByRole("heading", { name: "No addresses found" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Clear filters", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator(".table-wrap tbody tr")).toHaveCount(2);
  for (const type of ["Shipping", "Billing"]) {
    await nav.getByRole("link", { name: type, exact: true }).click();
    await expect(page.locator(".table-wrap tbody tr")).toHaveCount(1);
    await page.getByRole("link", { name: "Add address", exact: true }).click();
    await expect(page.getByLabel("Address type", { exact: true })).toHaveValue(
      type.toUpperCase(),
    );
  }
  await page.goto("/addresses");
  await expect(page).toHaveURL(/\/dashboard$/);
});
