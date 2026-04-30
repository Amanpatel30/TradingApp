import { useEffect, useMemo, useState } from "react";
import { Check, Coins, Palette, Save, UserRound } from "lucide-react";
import { useAppSession } from "../context/AppSession";
import { authApi } from "../lib/api";

const avatarColors = [
  "#4F46E5",
  "#2563EB",
  "#059669",
  "#D97706",
  "#DC2626",
  "#7C3AED",
  "#0F766E",
  "#EA580C",
];

const balancePresets = [2500, 5000, 10000, 25000];

function balanceLabel(amount) {
  return `+$${amount.toLocaleString()}`;
}

export function ProfilePage() {
  const { accessToken, user, setUser } = useAppSession();
  const [name, setName] = useState(user?.name || "");
  const [avatarLabel, setAvatarLabel] = useState(user?.avatarLabel || "");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || avatarColors[0]);
  const [demoDataFallbackEnabled, setDemoDataFallbackEnabled] = useState(
    Boolean(user?.demoDataFallbackEnabled),
  );
  const [balanceAmount, setBalanceAmount] = useState("2500");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isAddingBalance, setIsAddingBalance] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setAvatarLabel(user?.avatarLabel || "");
    setAvatarColor(user?.avatarColor || avatarColors[0]);
    setDemoDataFallbackEnabled(Boolean(user?.demoDataFallbackEnabled));
  }, [user?.avatarColor, user?.avatarLabel, user?.demoDataFallbackEnabled, user?.name]);

  const walletUsdt = Number(user?.wallet?.USDT || 0);
  const avatarPreview = useMemo(() => {
    const compact = String(avatarLabel || "")
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 2)
      .toUpperCase();

    if (compact) {
      return compact;
    }

    return String(name || user?.email || "U")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "U";
  }, [avatarLabel, name, user?.email]);

  const refreshChrome = () => {
    window.dispatchEvent(new CustomEvent("app:refresh-chrome"));
  };

  const saveProfile = async () => {
    if (!accessToken) {
      return;
    }

    try {
      setIsSavingProfile(true);
      setError("");
      setStatus("");

      const response = await authApi.updateProfile(accessToken, {
        name,
        avatarLabel,
        avatarColor,
        demoDataFallbackEnabled,
      });

      setUser(response.user);
      refreshChrome();
      setStatus("Profile updated.");
    } catch (requestError) {
      setError(requestError.message || "Failed to update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const addBalance = async (event) => {
    event?.preventDefault?.();
    if (!accessToken) {
      return;
    }

    try {
      setIsAddingBalance(true);
      setError("");
      setStatus("");

      const response = await authApi.addDemoBalance(accessToken, Number(balanceAmount));
      setUser(response.user);
      refreshChrome();
      setStatus(
        `$${Number(response.amountAdded || 0).toLocaleString()} added. New USDT balance: $${Number(
          response.newUsdtBalance || 0,
        ).toLocaleString()}.`,
      );
    } catch (requestError) {
      setError(requestError.message || "Failed to add demo balance.");
    } finally {
      setIsAddingBalance(false);
    }
  };

  return (
    <div className="px-5 py-6 md:px-6 lg:px-8" style={{ color: "#0F172A" }}>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Profile
          </h1>
          <p style={{ color: "#64748B", fontSize: "1rem" }}>
            Manage your avatar, name, and demo account balance from one place.
          </p>
        </div>
        <div
          className="inline-flex items-center gap-2 rounded-2xl px-4 py-2"
          style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#047857" }}
        >
          <Coins size={16} />
          <span style={{ fontWeight: 700 }}>
            USDT Wallet ${walletUsdt.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section
          className="rounded-3xl p-6"
          style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
              style={{ background: avatarColor, fontSize: "1.1rem", fontWeight: 800 }}
            >
              {avatarPreview}
            </div>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Public Identity</h2>
              <p style={{ color: "#64748B" }}>
                Update how your account appears across the dashboard, leaderboard, and shell.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span style={{ fontWeight: 600, color: "#334155" }}>Display Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                className="rounded-2xl px-4 py-3 outline-none"
                style={{ border: "1px solid #CBD5E1", background: "#F8FAFC" }}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span style={{ fontWeight: 600, color: "#334155" }}>Avatar Label</span>
              <input
                value={avatarLabel}
                maxLength={2}
                onChange={(event) => setAvatarLabel(event.target.value.toUpperCase())}
                placeholder="AT"
                className="rounded-2xl px-4 py-3 uppercase outline-none"
                style={{ border: "1px solid #CBD5E1", background: "#F8FAFC" }}
              />
            </label>
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2" style={{ fontWeight: 600, color: "#334155" }}>
              <Palette size={16} />
              Avatar Color
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {avatarColors.map((color) => {
                const isActive = avatarColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Choose avatar color ${color}`}
                    onClick={() => setAvatarColor(color)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl transition-transform hover:scale-105"
                    style={{
                      background: color,
                      border: isActive ? "3px solid #0F172A" : "2px solid rgba(15,23,42,0.08)",
                    }}
                  >
                    {isActive ? <Check size={16} color="#FFFFFF" /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="mt-5 rounded-2xl p-4"
            style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
          >
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                aria-label="Show demo data fallback"
                checked={demoDataFallbackEnabled}
                onChange={(event) => setDemoDataFallbackEnabled(event.target.checked)}
                className="mt-1 h-4 w-4 rounded"
              />
              <div>
                <div style={{ fontWeight: 700, color: "#0F172A" }}>Show demo data</div>
                <p style={{ color: "#64748B", fontSize: "0.92rem", lineHeight: 1.5 }}>
                  When enabled, charts and market widgets will switch to demo data if live
                  backend data is temporarily unavailable. When disabled, those views stay empty
                  instead of showing fallback data.
                </p>
              </div>
            </label>
          </div>

          <button
            type="button"
            onClick={saveProfile}
            disabled={isSavingProfile}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-white transition-opacity"
            style={{ background: "#2563EB", opacity: isSavingProfile ? 0.6 : 1 }}
          >
            <Save size={16} />
            {isSavingProfile ? "Saving..." : "Save Profile"}
          </button>
        </section>

        <section className="flex flex-col gap-6">
          <div
            className="rounded-3xl p-6"
            style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ background: "#EEF2FF", color: "#4F46E5" }}
              >
                <Coins size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Increase Demo Balance</h2>
                <p style={{ color: "#64748B" }}>
                  Add more USDT to test orders, analytics, and portfolio changes.
                </p>
              </div>
            </div>

            <form className="mt-5 flex flex-col gap-4" onSubmit={addBalance}>
              <label className="flex flex-col gap-2">
                <span style={{ fontWeight: 600, color: "#334155" }}>Amount (USDT)</span>
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={balanceAmount}
                  onChange={(event) => setBalanceAmount(event.target.value)}
                  className="rounded-2xl px-4 py-3 outline-none"
                  style={{ border: "1px solid #CBD5E1", background: "#F8FAFC" }}
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {balancePresets.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setBalanceAmount(String(amount))}
                    className="rounded-full px-3 py-2 text-sm"
                    style={{ background: "#EFF6FF", color: "#2563EB", fontWeight: 700 }}
                  >
                    {balanceLabel(amount)}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={addBalance}
                disabled={isAddingBalance}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-white transition-opacity"
                style={{ background: "#059669", opacity: isAddingBalance ? 0.6 : 1 }}
              >
                <Coins size={16} />
                {isAddingBalance ? "Adding..." : "Add Demo Balance"}
              </button>
            </form>
          </div>

          <div
            className="rounded-3xl p-6"
            style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ background: "#F1F5F9", color: "#334155" }}
              >
                <UserRound size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Account Snapshot</h2>
                <p style={{ color: "#64748B" }}>
                  Quick profile values currently stored for your user.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "#F8FAFC" }}>
                <span style={{ color: "#64748B" }}>Email</span>
                <span style={{ fontWeight: 700 }}>{user?.email || "—"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "#F8FAFC" }}>
                <span style={{ color: "#64748B" }}>Account Status</span>
                <span style={{ fontWeight: 700, color: "#059669" }}>{user?.status || "active"}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "#F8FAFC" }}>
                <span style={{ color: "#64748B" }}>Avatar Preview</span>
                <span style={{ fontWeight: 700 }}>{avatarPreview}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {status ? (
        <div
          className="mt-5 rounded-2xl px-4 py-3"
          style={{ background: "#ECFDF5", color: "#047857", border: "1px solid #A7F3D0" }}
        >
          {status}
        </div>
      ) : null}

      {error ? (
        <div
          className="mt-4 rounded-2xl px-4 py-3"
          style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
