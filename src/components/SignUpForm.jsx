﻿import React, { useState } from "react";

const SignUpForm = ({ onSignUp, onSwitchToLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    onSignUp(name, email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div style={{ background: "rgba(239,68,68,0.2)", border: "1px solid #ef4444", color: "#fecaca", padding: "0.75rem", borderRadius: "0.5rem", marginBottom: "1rem" }}>{error}</div>}
      <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white", outline: "none" }} required />
      <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white", outline: "none" }} required />
      <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white", outline: "none" }} required />
      <input type={showPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white", outline: "none" }} required />
      <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
        <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} style={{ marginRight: "0.5rem" }} />
        <label style={{ color: "#c7d2fe" }}>Show password</label>
      </div>
      <button type="submit" style={{ width: "100%", padding: "0.75rem", borderRadius: "0.75rem", border: "none", background: "linear-gradient(135deg, #9333ea, #db2777)", color: "white", fontWeight: "bold", cursor: "pointer", marginBottom: "1rem" }}>Sign Up</button>
      <p style={{ textAlign: "center", color: "#c7d2fe" }}>Already have an account? <button type="button" onClick={onSwitchToLogin} style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontWeight: "bold" }}>Sign In</button></p>
    </form>
  );
};

export default SignUpForm;
