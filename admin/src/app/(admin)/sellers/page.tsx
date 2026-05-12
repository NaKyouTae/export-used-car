"use client";

import { useEffect, useState } from "react";

interface Seller {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
  _count?: { cars: number };
}

interface CreateSellerForm {
  email: string;
  companyName: string;
  contactName: string;
  phone: string;
  businessNumber: string;
  address: string;
}

const initialForm: CreateSellerForm = {
  email: "",
  companyName: "",
  contactName: "",
  phone: "",
  businessNumber: "",
  address: "",
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "PENDING"
      ? "badge-pending"
      : status === "ACTIVE"
        ? "badge-active"
        : status === "SUSPENDED"
          ? "badge-suspended"
          : "badge-draft";
  return <span className={cls}>{status}</span>;
}

function formatDate(s: string) {
  return s ? s.slice(0, 10) : "-";
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CreateSellerForm>(initialForm);
  const [creating, setCreating] = useState(false);

  const load = async (cursor?: string | null, reset = false) => {
    if (reset) {
      setLoading(true);
      setNextCursor(null);
    }

    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("limit", "20");
    if (cursor) params.set("cursor", cursor);

    try {
      const res = await fetch(`/api/sellers?${params}`);
      const data = await res.json();
      const items = data.data || [];

      if (reset) {
        setSellers(Array.isArray(items) ? items : []);
      } else {
        setSellers((prev) => [
          ...prev,
          ...(Array.isArray(items) ? items : []),
        ]);
      }
      setNextCursor(data.nextCursor || null);
    } catch {
      alert("Failed to load sellers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await load(null, true);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleCreateSeller = async () => {
    if (!form.email || !form.companyName || !form.contactName || !form.phone) {
      alert("Please fill in all required fields");
      return;
    }
    setCreating(true);
    try {
      const body: Record<string, string> = {
        email: form.email,
        companyName: form.companyName,
        contactName: form.contactName,
        phone: form.phone,
      };
      if (form.businessNumber) body.businessNumber = form.businessNumber;
      if (form.address) body.address = form.address;

      const res = await fetch("/api/sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Failed to create seller");
      }
      setShowModal(false);
      setForm(initialForm);
      await load(null, true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create seller");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id: string, current: string) => {
    const newStatus = current === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch(`/api/sellers/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setSellers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
    } catch {
      alert("Failed to update seller status");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          + Register Seller
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Cars</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((s) => (
                  <tr key={s.id}>
                    <td>{s.companyName}</td>
                    <td>{s.contactName}</td>
                    <td>{s.email}</td>
                    <td>{s.phone || "-"}</td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td>{s._count?.cars ?? "-"}</td>
                    <td>{formatDate(s.createdAt)}</td>
                    <td className="space-x-2">
                      {(s.status === "ACTIVE" ||
                        s.status === "SUSPENDED") && (
                        <button
                          onClick={() =>
                            handleToggleStatus(s.id, s.status)
                          }
                          className={`btn btn-sm ${s.status === "ACTIVE" ? "btn-danger" : "btn-primary"}`}
                        >
                          {s.status === "ACTIVE" ? "Suspend" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {sellers.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center text-gray-400 py-8"
                    >
                      No sellers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {nextCursor && (
              <div className="p-4 text-center border-t border-gray-100">
                <button
                  onClick={() => load(nextCursor)}
                  className="btn btn-secondary"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Register Seller</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="seller@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, companyName: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactName: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Number
                </label>
                <input
                  type="text"
                  value={form.businessNumber}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      businessNumber: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm(initialForm);
                }}
                className="btn btn-secondary"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSeller}
                className="btn btn-primary"
                disabled={creating}
              >
                {creating ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
