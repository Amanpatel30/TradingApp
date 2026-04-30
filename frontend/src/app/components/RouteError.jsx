import { isRouteErrorResponse, Link, useRouteError } from "react-router";

export function RouteError() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error?.message || "Something went wrong while rendering this page.";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "#F8FAFC", fontFamily: "Inter, sans-serif" }}
    >
      <div
        className="max-w-lg w-full rounded-2xl p-8"
        style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}
      >
        <h1
          className="text-xl mb-3"
          style={{ color: "#111827", fontWeight: 800, letterSpacing: "-0.03em" }}
        >
          Page unavailable
        </h1>
        <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
          {message}
        </p>
        <div className="flex items-center gap-3">
          <Link
            to="/app/dashboard"
            className="px-4 py-2 rounded-lg text-sm text-white"
            style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", fontWeight: 600 }}
          >
            Open dashboard
          </Link>
          <Link
            to="/login"
            className="px-4 py-2 rounded-lg text-sm"
            style={{ color: "#3B82F6", border: "1px solid rgba(59,130,246,0.2)", fontWeight: 600 }}
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
