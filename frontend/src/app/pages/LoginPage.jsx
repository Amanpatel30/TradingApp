import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { AuthSidePanel } from "../components/AuthSidePanel";
import { authApi } from "../lib/api";
import { useAppSession } from "../context/AppSession";

// Simple Google SVG
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// Simple Apple icon
function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

const inputWrapStyle = {
  position: "relative",
  display: "flex",
  alignItems: "center",
};

const inputIconStyle = {
  position: "absolute",
  left: 14,
  color: "#B0BAC7",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
};

function FormInput({ icon: Icon, type, placeholder, value, onChange, rightEl }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={inputWrapStyle}>
      <span style={inputIconStyle}>
        <Icon size={15} />
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full outline-none text-sm"
        style={{
          paddingLeft: 40,
          paddingRight: rightEl ? 40 : 14,
          paddingTop: 11,
          paddingBottom: 11,
          borderRadius: 10,
          background: "#F7FAFC",
          border: `1.5px solid ${focused ? "#00C98D" : "#E2E8F0"}`,
          color: "#1E293B",
          transition: "border-color 0.15s",
          fontSize: "0.85rem",
        }}
      />
      {rightEl && (
        <span
          style={{
            position: "absolute",
            right: 12,
            color: "#B0BAC7",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          {rightEl}
        </span>
      )}
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { saveAuthSession } = useAppSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.login(email, password);
      saveAuthSession(response);
      navigate("/app/dashboard");
    } catch (err) {
      setError(err.message || "Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #EDF0F8 0%, #E4E8F4 40%, #EBF0FB 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        padding: "24px 16px",
      }}
    >
      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 860,
          display: "flex",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.06)",
          minHeight: 560,
        }}
      >
        {/* Left: Dark branding panel */}
        <div style={{ width: "42%", minWidth: 0, flexShrink: 0 }} className="hidden md:block">
          <AuthSidePanel />
        </div>

        {/* Right: Login form */}
        <div
          style={{
            flex: 1,
            background: "white",
            padding: "48px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1
              style={{
                color: "#0F172A",
                fontWeight: 800,
                fontSize: "1.65rem",
                letterSpacing: "-0.03em",
                marginBottom: 6,
              }}
            >
              Welcome back
            </h1>
            <p style={{ color: "#8A9AB0", fontSize: "0.85rem" }}>
              Sign in to your CryptoSim account
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(234,57,67,0.07)",
                border: "1px solid rgba(234,57,67,0.2)",
                color: "#DC2626",
                fontSize: "0.82rem",
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email */}
            <div>
              <label style={{ display: "block", color: "#374151", fontWeight: 500, fontSize: "0.83rem", marginBottom: 6 }}>
                Email address
              </label>
              <FormInput
                icon={Mail}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ color: "#374151", fontWeight: 500, fontSize: "0.83rem" }}>
                  Password
                </label>
                <button
                  type="button"
                  style={{ color: "#3B82F6", fontSize: "0.78rem", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>
              <FormInput
                icon={Lock}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                rightEl={
                  <span onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </span>
                }
              />
            </div>

            {/* Remember me */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                onClick={() => setRememberMe(!rememberMe)}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: `2px solid ${rememberMe ? "#00C98D" : "#CBD5E1"}`,
                  background: rememberMe ? "#00C98D" : "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                {rememberMe && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <label
                onClick={() => setRememberMe(!rememberMe)}
                style={{ color: "#64748B", fontSize: "0.82rem", cursor: "pointer", userSelect: "none" }}
              >
                Keep me signed in for 30 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                background: loading
                  ? "#A7F3D0"
                  : "linear-gradient(90deg, #00C98D 0%, #0EA5E9 100%)",
                color: "white",
                fontWeight: 700,
                fontSize: "0.9rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.15s, transform 0.1s",
                letterSpacing: "0.01em",
                marginTop: 4,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = "0.92"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#E9EDF4" }} />
            <span style={{ color: "#A0AEBE", fontSize: "0.75rem" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#E9EDF4" }} />
          </div>

          {/* OAuth Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Google", Icon: GoogleIcon },
              { label: "Apple", Icon: AppleIcon },
            ].map(({ label, Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate("/app/dashboard")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "white",
                  border: "1.5px solid #E2E8F0",
                  color: "#374151",
                  fontWeight: 500,
                  fontSize: "0.83rem",
                  cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F8FAFC";
                  e.currentTarget.style.borderColor = "#CBD5E1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.borderColor = "#E2E8F0";
                }}
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>

          {/* Footer link */}
          <p style={{ textAlign: "center", marginTop: 22, fontSize: "0.82rem", color: "#8A9AB0" }}>
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{ color: "#00C98D", fontWeight: 600, textDecoration: "none" }}
            >
              Create one →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
