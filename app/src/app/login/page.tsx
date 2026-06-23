"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = e.target.value.trim().toLowerCase();
    setEmail(formatted);
    if (error) setError("");
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      setError(t("Please enter a valid email address."));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || t("Failed to send code"));
        return;
      }
      setStep("code");
    } catch {
      setError(t("Network error. Please try again."));
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
        body: JSON.stringify({ email, code }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || t("Invalid code"));
        return;
      }

      if (data.accessToken || data.authenticated) {
        await login();
        router.push("/");
      } else if (data.tempToken) {
        router.push(
          `/register?tempToken=${data.tempToken}&email=${encodeURIComponent(email)}`
        );
      } else {
        router.push(`/register?email=${encodeURIComponent(email)}`);
      }
    } catch {
      setError(t("Network error. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white">
      <PageHeader title={t("Login")} />

      <div className="max-w-md mx-auto px-4 pt-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{t("Welcome")}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {t("Sign in with your email to continue")}
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("Email Address")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-main-500 focus:border-transparent"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email || !isValidEmail(email)}
              className="w-full py-3 bg-main-500 text-white font-semibold rounded-xl hover:bg-main-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t("Sending...") : t("Send Verification Code")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <p className="text-sm text-gray-500 text-center mb-4">
              {t("We sent a 6-digit code to")}{" "}
              <span className="font-medium text-gray-700">{email}</span>
            </p>
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {t("Verification Code")}
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-center tracking-[0.5em] font-mono text-lg focus:outline-none focus:ring-2 focus:ring-main-500 focus:border-transparent"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 bg-main-500 text-white font-semibold rounded-xl hover:bg-main-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t("Verifying...") : t("Verify Code")}
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
              {t("Use a different email")}
            </button>
          </form>
        )}

        <p className="mt-10 text-center text-[11px] text-gray-400 leading-relaxed">
          {t("By continuing, you agree to our")}{" "}
          <Link href="/terms" className="underline text-gray-500">
            {t("Terms of Service")}
          </Link>{" "}
          {t("and")}{" "}
          <Link href="/privacy" className="underline text-gray-500">
            {t("Privacy Policy")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
