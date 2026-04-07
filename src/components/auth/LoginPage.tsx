import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { UserRole } from "@/types";
import { User, Lock, Eye, EyeOff, Shield, Loader2, X, AlertCircle, Mail } from "lucide-react";
import logoUrl from "@/logo.png";
import bgUrl from "@/assets/mogpog-rhu.jpg"; 

const roles: UserRole[] = ["Doctor", "Nurse", "Administrative Staff"];

export default function LoginPage() {
  const { login, forgotPassword, error, clearError, loading } = useAuth();
  const { addToast } = useToast();

  const [email,          setEmail]          = useState("");
  const [password,       setPassword]       = useState("");
  const [role,           setRole]           = useState<UserRole>("Administrative Staff");
  const [showPassword,   setShowPassword]   = useState(false);
  const [forgotOpen,     setForgotOpen]     = useState(false);
  const [resetEmail,     setResetEmail]     = useState("");
  const [resetSending,   setResetSending]   = useState(false);

  // ── Handlers ──────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      await login(email, password, role);
      addToast({ type: "success", title: "Welcome!", message: "Login successful." });
    } catch {
      // error is displayed via context; clear only the password
      setPassword("");
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) return;
    setResetSending(true);
    try {
      await forgotPassword(resetEmail);
      addToast({
        type: "success",
        title: "Reset Link Sent",
        message: "Check your email for the password reset link.",
      });
      setForgotOpen(false);
      setResetEmail("");
    } catch (err: any) {
      addToast({ type: "error", title: "Failed", message: err.message });
    } finally {
      setResetSending(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-stretch">

      {/* ── Left panel — branding ── */}
      {/* ── Left panel — branding ── */}
<div className="hidden md:flex md:w-1/2 relative flex-col items-center justify-center overflow-hidden">

  {/* Building background photo */}
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{ backgroundImage: `url(${bgUrl})` }}
  />

  {/* Dark maroon overlay so text stays readable */}
  <div className="absolute inset-0 bg-maroon/60" />

  {/* Branding content — unchanged */}
  <div className="relative z-10 flex flex-col items-center gap-4 px-10 text-center">
    <div className="rounded-3xl  shadow-lg">
      <img
        src={logoUrl}
        alt="ePRIME-RHU Logo"
        className="w-64 h-64 object-contain"
      />
    </div>
    {/* <h1 className="text-white text-4xl font-bold tracking-widest font-display">
      ePRIME-RHU
    </h1> */}
    <p className="text-white/80 text-sm leading-relaxed max-w-xs">
      Electronic Patient Record Information<br />
      and Management System For RHU<br />
      <span className="font-semibold">Mogpog</span>
    </p>
    <div className="w-16 h-px bg-gold/60 my-1" />
    <p className="text-gold text-sm italic tracking-[0.15em] font-semibold">
      Efficient. Secure. Organized
    </p>
  </div>
</div>

      {/* ── Right panel — login form ── */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-cream p-6">
        <div className="w-full max-w-sm">

          {/* Mobile-only logo */}
          <div className="flex flex-col items-center mb-8 md:hidden">
            <img
              src={logoUrl}
              alt="ePRIME-RHU"
              className="w-20 h-20 object-contain mb-2 rounded-full"
            />
            <h1 className="text-maroon text-2xl font-bold font-display">ePRIME-RHU</h1>
            <p className="text-maroon-300 text-xs text-center mt-1">
              Electronic Patient Record Information and Management System
            </p>
          </div>

          <h2 className="text-maroon text-2xl font-bold font-display mb-6">Login</h2>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={clearError} className="flex-shrink-0 hover:opacity-70">
                <X size={14} />
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">

            {/* Username / Email */}
            <div className="flex items-center border border-gray-300 rounded-md bg-white px-3 focus-within:border-maroon focus-within:ring-1 focus-within:ring-maroon transition-all">
              <User size={17} className="text-gray-400 flex-shrink-0" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 py-3 px-2.5 text-sm outline-none bg-transparent placeholder:text-gray-400"
                required
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="flex items-center border border-gray-300 rounded-md bg-white px-3 focus-within:border-maroon focus-within:ring-1 focus-within:ring-maroon transition-all">
              <Lock size={17} className="text-gray-400 flex-shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 py-3 px-2.5 text-sm outline-none bg-transparent placeholder:text-gray-400"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-maroon transition-colors ml-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Role selection — FIXED: each label calls setRole(r) on click */}
            <fieldset className="border border-gray-300 rounded-md px-4 py-3 bg-white">
              <legend className="text-xs font-semibold text-gray-500 px-1">Role</legend>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-0.5">
                {roles.map((r) => (
                  <label
                    key={r}
                    onClick={() => setRole(r)}           // ← fix: explicit click handler
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    {/* Custom radio circle */}
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                        ${role === r ? "border-maroon" : "border-gray-300"}`}
                    >
                      {role === r && (
                        <span className="w-2 h-2 rounded-full bg-maroon block" />
                      )}
                    </span>
                    <span
                      className={`text-sm transition-colors ${
                        role === r ? "text-maroon font-semibold" : "text-gray-600"
                      }`}
                    >
                      {r}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-maroon text-white font-semibold rounded-md hover:bg-maroon-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Forgot password */}
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="w-full text-center text-maroon text-sm font-semibold mt-4 hover:underline"
          >
            Forgot Password?
          </button>

          {/* Security note */}
          <div className="flex items-center justify-center gap-1.5 mt-6 text-gray-400 text-xs">
            <Shield size={12} />
            Your data is encrypted and protected
          </div>
        </div>
      </div>

      {/* ── Forgot Password Modal ── */}
      {forgotOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setForgotOpen(false); }}
        >
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-maroon font-bold text-lg mb-1 font-display">
              Reset Password
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <div className="flex items-center border border-gray-300 rounded-md px-3 mb-4 focus-within:border-maroon focus-within:ring-1 focus-within:ring-maroon transition-all bg-white">
              <Mail size={17} className="text-gray-400 flex-shrink-0" />
              <input
                type="email"
                placeholder="your@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="flex-1 py-3 px-2.5 text-sm outline-none bg-transparent"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setForgotOpen(false); setResetEmail(""); }}
                className="flex-1 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleForgotPassword}
                disabled={resetSending || !resetEmail}
                className="flex-1 py-2.5 bg-maroon text-white text-sm font-semibold rounded-md hover:bg-maroon-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {resetSending ? <Loader2 size={15} className="animate-spin" /> : "Send Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}