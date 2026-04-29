"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";

function SellerRegisterForm() {
  const router = useRouter();
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const tempToken = searchParams.get("tempToken") || "";
  const email = searchParams.get("email") || "";

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register/seller", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          tempToken,
          companyName,
          contactName,
          phone,
          businessNumber: businessNumber || undefined,
          address: address || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      await login();
      router.push("/seller/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 pt-8 pb-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Seller Registration</h2>
        <p className="text-gray-500 text-sm mt-1">
          Set up your seller account to start listing cars
        </p>
        {email && (
          <p className="text-sm text-gray-600 mt-2">
            Registering as <span className="font-medium">{email}</span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
            Company Name *
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Your Company Ltd."
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
            Contact Name *
          </label>
          <input
            id="contactName"
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="John Kim"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="seller-phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone *
          </label>
          <input
            id="seller-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+82 10-1234-5678"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="businessNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Business Number <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="businessNumber"
            type="text"
            value={businessNumber}
            onChange={(e) => setBusinessNumber(e.target.value)}
            placeholder="123-45-67890"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Seoul, South Korea"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !companyName || !contactName || !phone}
          className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Registering..." : "Register as Seller"}
        </button>
      </form>
    </div>
  );
}

export default function SellerRegisterPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="Register" />
      <Suspense fallback={<div className="flex justify-center pt-20"><div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}>
        <SellerRegisterForm />
      </Suspense>
    </div>
  );
}
