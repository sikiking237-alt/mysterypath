import React, { useState, useEffect } from "react";
import ReCAPTCHA from "react-google-recaptcha"; // Import ReCAPTCHA

const ForgotPassword = ({ onBackToLogin, darkMode }) => {
  const [step, setStep] = useState(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0); // New state for cooldown
  const [recaptchaToken, setRecaptchaToken] = useState(null); // State for reCAPTCHA token
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setError("Please enter your email address");
      return;
    }
    const isDev = import.meta.env.DEV;
    if (!isDev && !recaptchaToken) {
      setError("Please complete the reCAPTCHA verification.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, recaptcha_token: recaptchaToken })
      });
      const data = await res.json();
      if (res.ok) {
        setStep(2);
        setSuccess(data.message || "Reset code sent! Check the server console.");
      } else {
        setError(data.error || "Failed to send reset code");
        setSuccess(""); // Clear success message if there's an error
      }
    } catch (err) {
      setError("Cannot connect to server");
    } finally {
      setLoading(false);
      setRecaptchaToken(null); // Reset reCAPTCHA after attempt
    }
  };

  // Effect for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, code: resetCode })
      });
      if (res.ok) {
        setStep(3);
        setSuccess("Code verified!");
      } else {
        const data = await res.json();
        setError(data.error || "Invalid code");
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, code: resetCode, new_password: newPassword })
      });
      if (res.ok) {
        setSuccess("Password reset! Please login.");
        setTimeout(() => onBackToLogin(), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Reset failed");
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">{success}</div>}
      {step === 1 && (
        <form onSubmit={handleRequestReset}>
          <input type="email" placeholder="Email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4`} required />
          {/* reCAPTCHA Widget - optional in development */}
          {!import.meta.env.DEV && (
          <ReCAPTCHA
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "YOUR_RECAPTCHA_SITE_KEY"}
            onChange={setRecaptchaToken}
            onExpired={() => setRecaptchaToken(null)}
            onErrored={() => setRecaptchaToken(null)}
            theme={darkMode ? "dark" : "light"}
            className="mb-4"
          />
          )}
          <button type="submit" disabled={loading} className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 mb-4">{loading ? "Sending..." : "Send Code"}</button>
          <button type="button" onClick={onBackToLogin} className={`w-full py-2 rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-100'} font-semibold transition`}>Back</button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleVerifyCode}>
          <p className={`text-center mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            A 6-digit code has been sent to {resetEmail}.
          </p>
          <input type="text" placeholder="6-digit code" value={resetCode} onChange={(e) => setResetCode(e.target.value)} maxLength="6" className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4 text-center text-xl`} required />
          <button type="submit" disabled={loading} className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 mb-4">{loading ? "Verifying..." : "Verify"}</button>
          <button type="button" onClick={() => { handleRequestReset(); setResendCooldown(60); }} disabled={loading || resendCooldown > 0} className={`w-full py-2 rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-100'} font-semibold transition`}>
            {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}
          </button>
        </form>
      )}
      {step === 3 && (
        <form onSubmit={handleResetPassword}>
          <input type="password" placeholder="New password (min 6 chars)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4`} required />
          <input type="password" placeholder="Confirm password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4`} required />
          <button type="submit" disabled={loading} className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50">{loading ? "Resetting..." : "Reset Password"}</button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
