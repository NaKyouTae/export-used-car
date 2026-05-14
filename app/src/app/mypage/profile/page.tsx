"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { COUNTRIES } from "@/lib/constants";
import PageHeader from "@/components/PageHeader";

type AuthUser = NonNullable<ReturnType<typeof useAuth>["user"]>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <ProfileForm key={user.id} user={user} reloadUser={login} />;
}

function ProfileForm({
  user,
  reloadUser,
}: {
  user: AuthUser;
  reloadUser: () => Promise<unknown>;
}) {
  const isSeller = user.role === "SELLER";

  const [name, setName] = useState(() => user.name || "");
  const [phone, setPhone] = useState(() => user.phone || "");
  const [country, setCountry] = useState(() => user.country || "");
  const [company, setCompany] = useState(() =>
    isSeller ? "" : user.companyName || "",
  );
  const [companyName, setCompanyName] = useState(() =>
    isSeller ? user.companyName || "" : "",
  );
  const [contactName, setContactName] = useState(() => user.contactName || "");
  const [businessNumber, setBusinessNumber] = useState(
    () => user.businessNumber || "",
  );
  const [address, setAddress] = useState(() => user.address || "");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const body: Record<string, string | undefined> = isSeller
        ? {
            companyName,
            contactName,
            phone,
            businessNumber: businessNumber || undefined,
            address: address || undefined,
          }
        : {
            name,
            country,
            company: company || undefined,
            phone: phone || undefined,
          };

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await reloadUser();
        setMessage({ type: "success", text: "Profile updated successfully." });
      } else {
        setMessage({ type: "error", text: "Failed to update profile." });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-main-500 focus:ring-1 focus:ring-main-500";

  return (
    <div className="min-h-screen bg-white pb-[80px]">
      <PageHeader title="Edit Profile" />

      <div className="px-4 py-4 space-y-5">
        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1.5">Email</label>
          <div className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm text-gray-400">
            {user.email}
          </div>
        </div>

        {/* Account Type (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1.5">Account Type</label>
          <div className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm text-gray-400">
            {isSeller ? "Seller" : "User"}
          </div>
        </div>

        {isSeller ? (
          <>
            {/* Seller fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={inputClass}
                placeholder="Your Company Ltd."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className={inputClass}
                placeholder="John Kim"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="+82 10-1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Business Number <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={businessNumber}
                onChange={(e) => setBusinessNumber(e.target.value)}
                className={inputClass}
                placeholder="123-45-67890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Address <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass}
                placeholder="Seoul, South Korea"
              />
            </div>
          </>
        ) : (
          <>
            {/* Buyer fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={`${inputClass} bg-white`}
              >
                <option value="">Select your country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Company <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={inputClass}
                placeholder="Your company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="+234 800 000 0000"
              />
            </div>
          </>
        )}

        {/* Message */}
        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-500"}`}>
            {message.text}
          </p>
        )}
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-100 px-4 py-3 pb-safe">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-main-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
