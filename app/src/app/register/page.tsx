"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import CountrySelect from "@/components/CountrySelect";
import { useAuth } from "@/hooks/useAuth";

function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const tempToken = searchParams.get("tempToken") || "";
  const email = searchParams.get("email") || "";

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const allAgreed = agreedToTerms && agreedToPrivacy;
  const toggleAll = () => {
    const next = !allAgreed;
    setAgreedToTerms(next);
    setAgreedToPrivacy(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tempToken,
          name,
          country,
          company: company || undefined,
          phone: phone || undefined,
          agreedToTerms,
          agreedToPrivacy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      // Cookies are set by BFF, refresh auth cache
      await login();
      router.push("/");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitDisabled =
    loading || !name || !country || !agreedToTerms || !agreedToPrivacy;

  return (
    <>
      <div className="flex-1 px-4 pt-8 pb-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-500 text-sm mt-1">
            Complete your profile to get started
          </p>
          {email && (
            <p className="text-sm text-gray-600 mt-2">
              Registering as <span className="font-medium">{email}</span>
            </p>
          )}
        </div>

        <form
          id="register-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-main-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="country"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Country *
            </label>
            <CountrySelect
              id="country"
              value={country}
              onChange={setCountry}
              required
            />
          </div>

          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Company <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Your company name"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-main-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 800 000 0000"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-main-500 focus:border-transparent"
            />
          </div>
        </form>
      </div>

      <div
        className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-gray-100 px-4 pt-3 space-y-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      >
        <div className="space-y-2.5">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allAgreed}
              onChange={toggleAll}
              className="w-5 h-5 rounded border-gray-300 text-main-500 focus:ring-main-500"
            />
            <span className="text-sm font-semibold text-gray-900">
              Agree to all
            </span>
          </label>

          <ConsentRow
            checked={agreedToTerms}
            onChange={setAgreedToTerms}
            label="I agree to the Terms of Service"
            required
            href="/terms"
          />
          <ConsentRow
            checked={agreedToPrivacy}
            onChange={setAgreedToPrivacy}
            label="I agree to the Privacy Policy"
            required
            href="/privacy"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          form="register-form"
          disabled={submitDisabled}
          className="w-full py-3.5 bg-main-500 text-white font-semibold rounded-xl hover:bg-main-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </div>
    </>
  );
}

function ConsentRow({
  checked,
  onChange,
  label,
  required,
  href,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  required?: boolean;
  href: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded border-gray-300 text-main-500 focus:ring-main-500"
      />
      <span className="flex-1 text-sm text-gray-700">
        {required && <span className="text-red-500 mr-1">*</span>}
        {label}
      </span>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-main-600 underline"
        onClick={(e) => e.stopPropagation()}
      >
        View
      </Link>
    </label>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <PageHeader title="Register" />
      <Suspense
        fallback={
          <div className="flex-1 flex justify-center pt-20">
            <div className="w-6 h-6 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}
