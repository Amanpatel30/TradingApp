const API_BASE = "/api/v1";
const SESSION_KEY = "trading-app-session";

function parseResponse(response) {
  return response
    .json()
    .catch(() => ({}))
    .then((payload) => {
      if (!response.ok) {
        throw new Error(payload.message || "Something went wrong.");
      }

      return payload.data;
    });
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token
        ? {
            Authorization: `Bearer ${options.token}`,
          }
        : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  return parseResponse(response);
}

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY);
}

export const authApi = {
  login(email, password) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  register(payload) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getMe(token) {
    return request("/auth/me", {
      method: "GET",
      token,
    });
  },
  updateProfile(token, payload) {
    return request("/auth/profile", {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    });
  },
  addDemoBalance(token, amount) {
    return request("/auth/demo-balance", {
      method: "POST",
      token,
      body: JSON.stringify({ amount }),
    });
  },
  logout(token) {
    return request("/auth/logout", {
      method: "POST",
      token,
    });
  },
};

export const appApi = {
  getDashboardSummary(token, options = {}) {
    const query = new URLSearchParams();
    if (options.window) {
      query.set("window", options.window);
    }

    return request(`/dashboard/summary${query.toString() ? `?${query}` : ""}`, {
      method: "GET",
      token,
    });
  },
  getPortfolio(token) {
    return request("/portfolio", {
      method: "GET",
      token,
    });
  },
  getMarketTickers() {
    return request("/market/tickers", {
      method: "GET",
    });
  },
  getMarketOverview(options = {}) {
    const query = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, value);
      }
    });

    return request(`/market/overview${query.toString() ? `?${query}` : ""}`, {
      method: "GET",
    });
  },
  getOpenOrders(token) {
    return request("/orders/open", {
      method: "GET",
      token,
    });
  },
  getTradeHistory(token) {
    return request("/trades/history?page=1&limit=12", {
      method: "GET",
      token,
    });
  },
  getAnalytics(token) {
    return request("/insights/analytics", {
      method: "GET",
      token,
    });
  },
  getMistakeAnalysis(token) {
    return request("/insights/mistakes", {
      method: "GET",
      token,
    });
  },
  getLeaderboard(token, period, mode) {
    const query = new URLSearchParams();
    if (period) {
      query.set("period", period);
    }
    if (mode) {
      query.set("mode", mode);
    }

    return request(`/insights/leaderboard${query.toString() ? `?${query}` : ""}`, {
      method: "GET",
      token,
    });
  },
  getJournal(token) {
    return request("/journal", {
      method: "GET",
      token,
    });
  },
  saveJournalEntry(token, payload, entryId) {
    return request(`/journal${entryId ? `/${entryId}` : ""}`, {
      method: entryId ? "PATCH" : "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  deleteJournalEntry(token, entryId) {
    return request(`/journal/${entryId}`, {
      method: "DELETE",
      token,
    });
  },
  getStrategies(token) {
    return request("/strategies", {
      method: "GET",
      token,
    });
  },
  createStrategy(token, payload) {
    return request("/strategies", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  updateStrategy(token, strategyId, payload) {
    return request(`/strategies/${strategyId}`, {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    });
  },
  deleteStrategy(token, strategyId) {
    return request(`/strategies/${strategyId}`, {
      method: "DELETE",
      token,
    });
  },
  backtestStrategy(token, payload) {
    return request("/strategies/backtest", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  getLearningOverview(token) {
    return request("/learning/overview", {
      method: "GET",
      token,
    });
  },
  updateLearningProgress(token, lessonId, payload) {
    return request(`/learning/lessons/${lessonId}/progress`, {
      method: "PATCH",
      token,
      body: JSON.stringify(payload),
    });
  },
  getReplaySession(token, options = {}) {
    const query = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, value);
      }
    });

    return request(`/replay/session${query.toString() ? `?${query}` : ""}`, {
      method: "GET",
      token,
    });
  },
  saveReplayTrade(token, payload) {
    return request("/replay/trade", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  resetReplaySession(token, payload) {
    return request("/replay/reset", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  placeMarketOrder(token, payload) {
    return request("/orders/market", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  placeLimitOrder(token, payload) {
    return request("/orders/limit", {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    });
  },
  cancelOrder(token, orderId) {
    return request(`/orders/${orderId}/cancel`, {
      method: "PATCH",
      token,
    });
  },
};
