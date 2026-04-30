import { test, expect } from "@playwright/test";

const demoUser = {
  email: "user@gmail.com",
  password: "Demo@12345",
};

test.describe("CryptoSim app", () => {
  async function login(page, credentials = demoUser) {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(credentials.email);
    await page
      .locator('input[type="password"]')
      .first()
      .fill(credentials.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/app\/dashboard/);
  }

  async function register(page, overrides = {}) {
    const uniqueEmail = overrides.email || `playwright-${Date.now()}@example.com`;

    await page.goto("/register");
    await page.locator('input[type="text"]').first().fill(
      overrides.name || "Playwright User",
    );
    await page.locator('input[type="email"]').fill(uniqueEmail);
    await page.locator('input[type="password"]').nth(0).fill(
      overrides.password || "Demo@12345",
    );
    await page.locator('input[type="password"]').nth(1).fill(
      overrides.password || "Demo@12345",
    );
    await page
      .getByText("I agree to CryptoSim's Terms of Service and Privacy Policy")
      .click();
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/app\/dashboard/);

    return {
      email: uniqueEmail,
      password: overrides.password || "Demo@12345",
    };
  }

  test("demo user can log in and view dynamic dashboard data", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("Portfolio Equity Curve")).toBeVisible();
    await expect(page.getByText("Monthly Returns Heatmap")).toBeVisible();
    await expect(page.getByText("Recent Trades")).toBeVisible();
    await expect(page.getByText("BTC Benchmark").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "6M" })).toBeVisible();
    await expect(page.getByRole("button", { name: "15M" })).toBeVisible();
    await expect(page.getByText(/Execution solid|Review exits|No closed trades/)).toBeVisible();
  });

  test("new user can register and reach the dashboard", async ({ page }) => {
    await register(page);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByText("No trades yet for this account.")).toBeVisible();
  });

  test("profile updates avatar and demo balance", async ({ page }) => {
    await login(page);

    await page.getByLabel("Open profile").first().click();
    await expect(page).toHaveURL(/\/app\/profile/);
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    const walletText = await page.getByText(/USDT Wallet \$[\d,]+/).textContent();
    const walletBefore = Number((walletText || "").replace(/[^\d.]/g, ""));

    await page.getByLabel("Avatar Label").fill("PW");
    await page.getByLabel("Choose avatar color #059669").click();
    await page.getByRole("button", { name: "Save Profile" }).click();
    await expect(page.getByText("Profile updated.")).toBeVisible();
    await expect(page.getByLabel("Open profile").first()).toContainText("PW");

    await page.getByRole("button", { name: "+$2,500" }).click();
    await page.getByRole("button", { name: "Add Demo Balance" }).click();
    await expect(page.getByText(/\$2,500 added\./)).toBeVisible();

    const walletTextAfter = await page.getByText(/USDT Wallet \$[\d,]+/).textContent();
    const walletAfter = Number((walletTextAfter || "").replace(/[^\d.]/g, ""));
    expect(walletAfter).toBeCloseTo(walletBefore + 2500, 2);
  });

  test("profile demo data toggle controls fallback rendering when analytics API fails", async ({
    page,
  }) => {
    await login(page);

    await page.goto("/app/profile");
    await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();

    const demoToggle = page.getByLabel("Show demo data fallback");
    await demoToggle.check();
    await page.getByRole("button", { name: "Save Profile" }).click();
    await expect(page.getByText("Profile updated.")).toBeVisible();

    await page.route("**/api/v1/insights/analytics", (route) => route.abort());

    await page.goto("/app/analytics");
    await expect(page.getByRole("heading", { name: "Trading Analytics" })).toBeVisible();
    await expect(
      page.getByText(/Showing demo analytics because the profile fallback is enabled/i),
    ).toBeVisible();
    await expect(page.getByText("72.4% win rate")).toBeVisible();

    await page.goto("/app/profile");
    await demoToggle.uncheck();
    await page.getByRole("button", { name: "Save Profile" }).click();
    await expect(page.getByText("Profile updated.")).toBeVisible();

    await page.goto("/app/analytics");
    await expect(page.getByRole("heading", { name: "Trading Analytics" })).toBeVisible();
    await expect(
      page.getByText(/Showing demo analytics because the profile fallback is enabled/i),
    ).toHaveCount(0);
    await expect(page.getByText("72.4% win rate")).toHaveCount(0);
  });

  test("concurrent market orders do not overspend the wallet", async ({ request }) => {
    const email = `playwright-concurrency-${Date.now()}@example.com`;
    const password = "Demo@12345";

    const registerResponse = await request.post("/api/v1/auth/register", {
      data: {
        name: "Playwright Concurrency",
        email,
        password,
      },
    });
    expect(registerResponse.ok()).toBeTruthy();
    const registerPayload = await registerResponse.json();
    const token = registerPayload?.data?.accessToken;
    expect(token).toBeTruthy();

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const bodyFor = (suffix) => ({
      symbol: "BTCUSDT",
      side: "BUY",
      quantity: 0.08,
      strategy: "Concurrency",
      stopLoss: 69000,
      takeProfit: 72000,
      clientOrderId: `pw-concurrency-${suffix}-${Date.now()}`,
    });

    const [a, b, c] = await Promise.all([
      request.post("/api/v1/orders/market", { headers, data: bodyFor("a") }),
      request.post("/api/v1/orders/market", { headers, data: bodyFor("b") }),
      request.post("/api/v1/orders/market", { headers, data: bodyFor("c") }),
    ]);

    const statuses = [a.status(), b.status(), c.status()];
    const tradingDisabled = statuses.every((status) => status === 503);

    if (tradingDisabled) {
      const payloads = await Promise.all([a.json(), b.json(), c.json()]);
      payloads.forEach((payload) => {
        expect(payload?.message || "").toMatch(/trading disabled|database not fully supported/i);
      });
      return;
    }

    const successCount = statuses.filter((status) => status === 201).length;
    expect(successCount).toBe(1);

    const meResponse = await request.get("/api/v1/auth/me", { headers });
    expect(meResponse.ok()).toBeTruthy();
    const mePayload = await meResponse.json();
    const usdtBalance = Number(mePayload?.data?.user?.wallet?.USDT || 0);
    expect(usdtBalance).toBeGreaterThanOrEqual(0);
  });

  test("simulator and replay charts show interactive OHLC tooltips on hover", async ({
    page,
  }) => {
    await login(page);

    await page.goto("/app/simulator");
    await expect(page.getByText("Trade Simulator").first()).toBeVisible();
    const simulatorChart = page.getByTestId("candlestick-chart").first();
    await page.waitForTimeout(400);
    const simulatorCanvas = simulatorChart.locator("canvas");
    const simulatorBox = await simulatorCanvas.boundingBox();
    if (!simulatorBox) {
      throw new Error("Simulator chart canvas not found");
    }
    await page.mouse.move(simulatorBox.x + 320, simulatorBox.y + 140);
    await page.waitForTimeout(150);
    await expect(simulatorChart.getByTestId("candlestick-tooltip")).toBeVisible();

    await page.goto("/app/replay");
    await expect(page.getByText("REPLAY MODE")).toBeVisible();
    const replayChart = page.getByTestId("candlestick-chart").first();
    await page.waitForTimeout(400);
    const replayCanvas = replayChart.locator("canvas");
    const replayBox = await replayCanvas.boundingBox();
    if (!replayBox) {
      throw new Error("Replay chart canvas not found");
    }
    await replayCanvas.scrollIntoViewIfNeeded();
    await page.mouse.move(replayBox.x + replayBox.width / 2, replayBox.y + replayBox.height / 2);
    await page.waitForTimeout(150);
    await expect(replayChart.getByTestId("candlestick-tooltip")).toBeVisible();
  });

  test("analytics, journal, strategy, replay, learning, and leaderboard pages load integrated data", async ({ page }) => {
    const strategyName = `PW Strategy ${Date.now()}`;

    await login(page);

    await page.goto("/app/analytics");
    await expect(page.getByRole("heading", { name: "Trading Analytics" })).toBeVisible();
    await expect(page.getByText("Strategy Performance Comparison")).toBeVisible();

    await page.goto("/app/journal");
    await expect(page.getByRole("heading", { name: "Trading Journal" })).toBeVisible();
    await page.locator("tbody tr").first().click();
    await page.locator("textarea").first().fill("Playwright verified journal save.");
    await page.getByRole("button", { name: "Save" }).click();

    await page.goto("/app/strategy");
    await expect(page.getByRole("heading", { name: "Strategy Builder" })).toBeVisible();
    await page.getByRole("textbox").first().fill(strategyName);
    await page.getByRole("button", { name: "Save" }).click();
    await page.getByRole("button", { name: /run backtest/i }).click();
    await expect(page.getByRole("heading", { name: "BACKTEST RESULTS" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();

    await page.goto("/app/replay");
    await expect(page.getByText("REPLAY MODE")).toBeVisible();
    await page.getByRole("button", { name: /buy \/ long/i }).click();
    await expect(page.getByText("Trades executed this session.")).toBeVisible();

    await page.goto("/app/learn");
    await expect(page.getByRole("heading", { name: "Learning Center" })).toBeVisible();
    await expect(page.getByText(/lessons/i).first()).toBeVisible();

    await page.goto("/app/leaderboard");
    await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();
    await expect(page.getByText(/Top performing traders/i)).toBeVisible();

    await page.goto("/app/mistakes");
    await expect(page.getByRole("heading", { name: "Mistake Analysis" })).toBeVisible();
    await expect(page.getByText("Most Common Mistakes")).toBeVisible();
  });

  test("fresh user can complete simulator, journal, strategy, replay, and learning CRUD flows", async ({
    page,
  }) => {
    const strategyName = `PW Strategy ${Date.now()}`;
    const updatedStrategyName = `${strategyName} Updated`;
    const manualJournalNote = `Playwright manual note ${Date.now()}`;
    const manualMistakeNote = `Playwright review ${Date.now()}`;

    const freshUser = await register(page);
    await page.evaluate(() => localStorage.clear());
    await login(page, freshUser);

    await page.goto("/app/simulator");
    await expect(page.getByText("Trade Simulator").first()).toBeVisible();

    const simulatorSubmitButton = page.getByRole("button", { name: /buy \/ long/i });
    const tradingDisabled = await simulatorSubmitButton.isDisabled();

    if (tradingDisabled) {
      await expect(page.getByText(/Trading disabled/i).first()).toBeVisible();
      await expect(
        page.getByText(/database not fully supported|Trading disabled/i).first(),
      ).toBeVisible();
    } else {
      await page.getByRole("button", { name: /^limit$/i }).click();
      await page.locator('label:has-text("Price (USDT)") + input').fill("50000");
      await page.locator('label:has-text("Size (BTC)") + input').fill("0.01");
      await page.locator('label:has-text("Strategy") + select').selectOption("VWAP");
      await page
        .locator('textarea[placeholder="Why take this trade?"]')
        .fill("Playwright limit order test");
      await simulatorSubmitButton.click();
      await expect(page.getByText("Buy limit order placed")).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Open Orders \([1-9]\d*\)/ }),
      ).toBeVisible();
      await page.getByRole("button", { name: /^Cancel$/ }).first().click();
      await expect(
        page.getByRole("button", { name: /Open Orders \(0\)/ }),
      ).toBeVisible();

      await page.getByRole("button", { name: /^market$/i }).click();
      await simulatorSubmitButton.click();
      await expect(page.getByText(/market order filled/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /History \([1-9]\d*\)/ })).toBeVisible();
      await expect(page.getByText("VWAP").first()).toBeVisible();
    }

    await page.goto("/app/journal");
    await expect(page.getByRole("heading", { name: "Trading Journal" })).toBeVisible();
    await page.getByRole("button", { name: /new entry/i }).click();
    await page.locator("textarea").first().fill(manualJournalNote);
    await page.getByRole("button", { name: "Analysis" }).click();
    await page.locator("textarea").first().fill(manualMistakeNote);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    await page.getByPlaceholder("Search trades...").fill("Manual");
    await expect(page.getByText("1 trades")).toBeVisible();
    await expect(page.locator("tbody").getByText("Manual")).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("0 trades")).toBeVisible();

    await page.goto("/app/strategy");
    await expect(page.getByRole("heading", { name: "Strategy Builder" })).toBeVisible();
    await page.locator("input").first().fill(strategyName);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
    await page.locator("input").first().fill(updatedStrategyName);
    await page.getByRole("button", { name: "Save" }).click();
    await page.getByRole("button", { name: /run backtest/i }).click();
    await expect(page.getByRole("heading", { name: "BACKTEST RESULTS" })).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.locator("select").first()).not.toContainText(updatedStrategyName);

    await page.goto("/app/replay");
    await expect(page.getByText("REPLAY MODE")).toBeVisible();
    await page.getByRole("button", { name: /buy \/ long/i }).click();
    await expect(page.getByText("Trades executed this session.")).toBeVisible();
    await expect(page.getByText(/Entry \$/).first()).toBeVisible();
    await page.getByRole("button", { name: /reset/i }).click();
    await expect(page.getByText(/Entry \$/)).toHaveCount(0);

    await page.goto("/app/learn");
    await expect(page.getByRole("heading", { name: "Learning Center" })).toBeVisible();
    await page.getByRole("button", { name: /all lessons/i }).click();
    await page.getByText("RSI Reversal Strategy").first().click();
    await page.getByRole("button", { name: /take quiz to complete/i }).click();
    await page.getByRole("button", { name: /Risk a fixed % per trade/i }).click();
    await page.getByRole("button", { name: /next question/i }).click();
    await page.getByRole("button", { name: /Risk \$1 to make \$2/i }).click();
    await page.getByRole("button", { name: /see results/i }).click();
    await page.getByRole("button", { name: /complete lesson/i }).click();
    await expect(page.getByText(/Lesson Complete!/i)).toBeVisible();

    await page.goto("/app/analytics");
    await expect(page.getByRole("heading", { name: "Trading Analytics" })).toBeVisible();

    await page.goto("/app/leaderboard");
    await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();

    await page.goto("/app/mistakes");
    await expect(page.getByRole("heading", { name: "Mistake Analysis" })).toBeVisible();
  });
});
