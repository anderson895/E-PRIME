import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import type { UserRole } from "@/types";
import {
  Heart, Users, Lock, Mail, Shield, AlertCircle, Eye, EyeOff, Loader2, X,
} from "lucide-react";

export default function LoginPage() {
  const { login, forgotPassword, error, clearError, loading } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("Administrative Staff");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSending, setResetSending] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      await login(email, password, role);
      addToast({ type: "success", title: "Welcome!", message: "Login successful." });
    } catch {
      // error is set in context
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
      addToast({
        type: "error",
        title: "Failed",
        message: err.message,
      });
    } finally {
      setResetSending(false);
    }
  };

  const roles: UserRole[] = ["Doctor", "Nurse", "Administrative Staff"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-maroon-800 via-maroon to-maroon-600 p-4 relative overflow-hidden">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative circles */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6">
        {/* Logo & Branding */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white shadow-xl flex items-center justify-center">
            <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-maroon to-red-700 flex items-center justify-center">
              <Heart size={28} className="text-white" fill="white" />
            </div>
          </div>
          <h1 className="font-display text-gold text-3xl font-bold tracking-wider">
            ePRIME-RHU
          </h1>
          <p className="text-white/60 text-xs mt-1 leading-relaxed">
            Electronic Patient Record Information<br />
            and Management System for RHU
          </p>
          <p className="text-gold/70 text-[11px] italic mt-2 tracking-[0.2em] font-semibold">
            Efficient · Secure · Organized
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full bg-white rounded-2xl shadow-2xl p-7">
          <h2 className="text-center text-maroon text-xl font-bold mb-5 font-display">
            Sign In
          </h2>

          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={clearError} className="flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-maroon-300 mb-1 block">
                Email Address
              </label>
              <div className="flex items-center border-2 border-maroon-100 rounded-lg px-3 focus-within:border-maroon focus-within:ring-2 focus-within:ring-maroon/10 transition-all">
                <Mail size={18} className="text-maroon-200 flex-shrink-0" />
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 border-none outline-none py-3 px-2.5 text-sm bg-transparent placeholder:text-maroon-100"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-maroon-300 mb-1 block">
                Password
              </label>
              <div className="flex items-center border-2 border-maroon-100 rounded-lg px-3 focus-within:border-maroon focus-within:ring-2 focus-within:ring-maroon/10 transition-all">
                <Lock size={18} className="text-maroon-200 flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 border-none outline-none py-3 px-2.5 text-sm bg-transparent placeholder:text-maroon-100"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-maroon-200 hover:text-maroon transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <fieldset className="border-2 border-maroon-100 rounded-lg px-4 py-3">
              <legend className="text-xs font-semibold text-maroon-300 px-1.5">
                Role
              </legend>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {roles.map((r) => (
                  <label
                    key={r}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                        ${role === r ? "border-maroon" : "border-maroon-100 group-hover:border-maroon-200"}`}
                    >
                      {role === r && (
                        <div className="w-2 h-2 rounded-full bg-maroon" />
                      )}
                    </div>
                    <span
                      className={`text-sm transition-colors
                        ${role === r ? "text-maroon font-semibold" : "text-maroon-300"}`}
                    >
                      {r}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <button
            onClick={() => setForgotOpen(true)}
            className="w-full text-center text-maroon text-sm font-semibold mt-4 hover:underline"
          >
            Forgot Password?
          </button>

          <div className="flex items-center justify-center gap-1.5 mt-5 text-maroon-200 text-xs">
            <Shield size={12} />
            Your data is encrypted and protected
          </div>
        </div>

        {/* Version */}
        <p className="text-white/30 text-[10px] tracking-wider">
          v1.0.0 · Rural Health Unit of Mogpog
        </p>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-maroon font-bold text-lg mb-2 font-display">
              Reset Password
            </h3>
            <p className="text-sm text-maroon-300 mb-4">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
            <div className="flex items-center border-2 border-maroon-100 rounded-lg px-3 mb-4 focus-within:border-maroon transition-all">
              <Mail size={18} className="text-maroon-200" />
              <input
                type="email"
                placeholder="your@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="flex-1 border-none outline-none py-2.5 px-2.5 text-sm bg-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setForgotOpen(false);
                  setResetEmail("");
                }}
                className="flex-1 py-2.5 bg-maroon-50 text-maroon text-sm font-medium rounded-lg hover:bg-maroon-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleForgotPassword}
                disabled={resetSending}
                className="btn-primary flex-1"
              >
                {resetSending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Send Link"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
