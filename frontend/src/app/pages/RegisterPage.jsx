import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { AuthSidePanel } from "../components/AuthSidePanel";
import { authApi } from "../lib/api";
import { useAppSession } from "../context/AppSession";

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

function FormInput({ icon: Icon, type, placeholder, value, onChange, rightEl, error }) {
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
          border: `1.5px solid ${error ? "#EF4444" : focused ? "#00C98D" : "#E2E8F0"}`,
          color: "#1E293B",
          transition: "border-color 0.15s",
          fontSize: "0.85rem",
          width: "100%",
          boxSizing: "border-box",
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

export function RegisterPage() {
  const navigate = useNavigate();
  const { saveAuthSession } = useAppSession();
  const termsInputId = "register-terms";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordMismatch = confirm.length > 0 && confirm !== password;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.register({ name, email, password });
      saveAuthSession(response);
      navigate("/app/dashboard");
    } catch (err) {
      setError(err.message || "Unable to create the account right now.");
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

        {/* Right: Register form */}
        <div
          style={{
            flex: 1,
            background: "white",
            padding: "44px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <h1
              style={{
                color: "#0F172A",
                fontWeight: 800,
                fontSize: "1.65rem",
                letterSpacing: "-0.03em",
                marginBottom: 6,
              }}
            >
              Create account
            </h1>
            <p style={{ color: "#8A9AB0", fontSize: "0.85rem" }}>
              Start trading in under 2 minutes
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                marginBottom: 14,
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
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {/* Full name */}
            <div>
              <label style={{ display: "block", color: "#374151", fontWeight: 500, fontSize: "0.83rem", marginBottom: 5 }}>
                Full name
              </label>
              <FormInput
                icon={User}
                type="text"
                placeholder="Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", color: "#374151", fontWeight: 500, fontSize: "0.83rem", marginBottom: 5 }}>
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
              <label style={{ display: "block", color: "#374151", fontWeight: 500, fontSize: "0.83rem", marginBottom: 5 }}>
                Password
              </label>
              <FormInput
                icon={Lock}
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                rightEl={
                  <span onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </span>
                }
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: "block", color: "#374151", fontWeight: 500, fontSize: "0.83rem", marginBottom: 5 }}>
                Confirm password
              </label>
              <FormInput
                icon={Lock}
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={passwordMismatch}
                rightEl={
                  <span onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </span>
                }
              />
              {passwordMismatch && (
                <p style={{ color: "#EF4444", fontSize: "0.73rem", marginTop: 4 }}>
                  Passwords don't match
                </p>
              )}
            </div>

            {/* Terms */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <input
                id={termsInputId}
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{
                  position: "absolute",
                  opacity: 0,
                  pointerEvents: "none",
                  width: 1,
                  height: 1,
                }}
              />
              <label
                htmlFor={termsInputId}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  color: "#64748B",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  userSelect: "none",
                  lineHeight: 1.5,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: `2px solid ${agreedToTerms ? "#00C98D" : "#CBD5E1"}`,
                    background: agreedToTerms ? "#00C98D" : "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                    transition: "all 0.15s",
                  }}
                >
                  {agreedToTerms && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3L3.5 5.5L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                <span>
                I agree to CryptoSim's{" "}
                <span
                  style={{ color: "#3B82F6", fontWeight: 500 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms of Service
                </span>
                {" "}and{" "}
                <span
                  style={{ color: "#3B82F6", fontWeight: 500 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </span>
                </span>
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
                transition: "opacity 0.15s",
                letterSpacing: "0.01em",
                marginTop: 2,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = "0.92"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Footer link */}
          <p style={{ textAlign: "center", marginTop: 18, fontSize: "0.82rem", color: "#8A9AB0" }}>
            Already have an account?{" "}
            <Link
              to="/login"
              style={{ color: "#00C98D", fontWeight: 600, textDecoration: "none" }}
            >
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
