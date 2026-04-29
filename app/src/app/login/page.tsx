"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, userType: "BUYER" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to send code");
        return;
      }
      setStep("code");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code, userType: "BUYER" }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid code");
        return;
      }

      if (data.accessToken || data.authenticated) {
        // Existing user - cookies are set by BFF, refresh auth cache
        await login();
        router.push("/");
      } else if (data.tempToken) {
        // New user - needs registration
        router.push(
          `/register?tempToken=${data.tempToken}&email=${encodeURIComponent(email)}`
        );
      } else {
        router.push(`/register?email=${encodeURIComponent(email)}`);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="Login" />

      <div className="max-w-md mx-auto px-4 pt-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome</h2>
          <p className="text-gray-500 text-sm mt-1">
            Sign in with your email to continue
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-sm text-gray-500 text-center mb-4">
              We sent a 6-digit code to{" "}
              <span className="font-medium text-gray-700">{email}</span>
            </p>
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                maxLength={6}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
              }}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
