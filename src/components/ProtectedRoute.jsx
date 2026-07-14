// frontend/src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Real route protection — defense in depth, but NOT the only barrier.
 *
 * The CLIENT checks in this component are UX-only: they hide admin and
 * instructor pages from logged-out users and from users whose cached
 * role does not match. The SERVER is still the source of truth: every
 * /api/* request made by the wrapped page goes through the httpOnly
 * auth cookie and is re-validated by the backend, which performs the
 * actual authorization check.
 *
 * The check here is:
 *   1. Re-validate the session against /api/me on mount and whenever
 *      the location changes. If the server says "no valid session",
 *      redirect to /login.
 *   2. If a list of allowed roles is provided, the role returned by
 *      /api/me must be in that list, otherwise redirect to /.
 *
 * Notes:
 *   - We deliberately do NOT trust a role string from localStorage.
 *   - The "verifying" state prevents a flash of the protected page
 *     while the server round-trip is in flight.
 *   - If the server is unreachable, we redirect to /login rather than
 *     silently rendering the protected page.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const [status, setStatus] = useState("verifying"); // "verifying" | "ok" | "unauth" | "forbidden"
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      try {
        const response = await fetch("/api/me", {
          credentials: "include",
          headers: { Accept: "application/json" }
        });

        if (cancelled) return;

        if (!response.ok) {
          setStatus("unauth");
          setProfile(null);
          return;
        }

        const data = await response.json();
        setProfile(data);

        if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
          const role = (data?.role || "").toLowerCase();
          const allowed = allowedRoles.map((r) => String(r).toLowerCase());
          if (!allowed.includes(role)) {
            setStatus("forbidden");
            return;
          }
        }

        setStatus("ok");
      } catch (err) {
        if (cancelled) return;
        // On network failure, refuse to render the protected page.
        setStatus("unauth");
        setProfile(null);
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
    // Re-verify on every route change so a stale session cannot keep
    // granting access after the cookie is invalidated server-side.
  }, [location.pathname]);

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying session…</p>
        </div>
      </div>
    );
  }

  if (status === "unauth") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (status === "forbidden") {
    return <Navigate to="/" replace />;
  }

  return React.cloneElement(children, { serverProfile: profile });
};

export default ProtectedRoute;
