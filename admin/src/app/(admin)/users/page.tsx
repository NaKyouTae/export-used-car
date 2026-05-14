"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  country: string | null;
  company: string | null;
  role: "BUYER" | "SELLER";
  companyName: string | null;
  contactName: string | null;
  sellerStatus: string | null;
  isVerified: boolean;
  createdAt: string;
}

interface PromoteForm {
  companyName: string;
  contactName: string;
  phone: string;
  businessNumber: string;
  address: string;
}

const initialForm: PromoteForm = {
  companyName: "",
  contactName: "",
  phone: "",
  businessNumber: "",
  address: "",
};

function formatDate(s: string) {
  return s ? s.slice(0, 10) : "-";
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [promoteTarget, setPromoteTarget] = useState<User | null>(null);
  const [form, setForm] = useState<PromoteForm>(initialForm);
  const [promoting, setPromoting] = useState(false);

  const load = async (cursor?: string | null, reset = false) => {
    if (reset) {
      setLoading(true);
      setNextCursor(null);
    }
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (search) params.set("search", search);
    params.set("limit", "20");
    if (cursor) params.set("cursor", cursor);

    try {
      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      const items = Array.isArray(data.data) ? data.data : [];

      if (reset) {
        setUsers(items);
      } else {
        setUsers((prev) => [...prev, ...items]);
      }
      setNextCursor(data.nextCursor || null);
    } catch {
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, search]);

  const openPromoteModal = (user: User) => {
    setPromoteTarget(user);
    setForm({
      ...initialForm,
      contactName: user.name || "",
      phone: user.phone || "",
    });
  };

  const handlePromote = async () => {
    if (!promoteTarget) return;
    if (!form.companyName || !form.contactName || !form.phone) {
      alert("Please fill in Company / Contact / Phone");
      return;
    }
    setPromoting(true);
    try {
      const body: Record<string, string> = {
        companyName: form.companyName,
        contactName: form.contactName,
        phone: form.phone,
      };
      if (form.businessNumber) body.businessNumber = form.businessNumber;
      if (form.address) body.address = form.address;

      const res = await fetch(
        `/api/users/${promoteTarget.id}/promote-to-seller`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || "Failed to promote user");
      }
      setPromoteTarget(null);
      setForm(initialForm);
      await load(null, true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to promote user");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Roles</option>
            <option value="BUYER">Buyer</option>
            <option value="SELLER">Seller</option>
          </select>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(searchInput.trim());
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search email / name / company"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64"
            />
            <button type="submit" className="btn btn-secondary btn-sm">
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                }}
                className="btn btn-sm"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Country</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.name || u.contactName || "-"}</td>
                    <td>{u.country || "-"}</td>
                    <td>{u.phone || "-"}</td>
                    <td>
                      {u.role === "SELLER" ? (
                        <span className="badge-active">SELLER</span>
                      ) : (
                        <span className="badge-draft">BUYER</span>
                      )}
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      {u.role === "BUYER" ? (
                        <button
                          onClick={() => openPromoteModal(u)}
                          className="btn btn-primary btn-sm"
                        >
                          Promote to Seller
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">Seller</span>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-8">
                      No users found
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

      {promoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-1">Promote to Seller</h2>
            <p className="text-sm text-gray-500 mb-4">
              {promoteTarget.email}
            </p>
            <div className="space-y-3">
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
                  setPromoteTarget(null);
                  setForm(initialForm);
                }}
                className="btn btn-secondary"
                disabled={promoting}
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                className="btn btn-primary"
                disabled={promoting}
              >
                {promoting ? "Promoting..." : "Promote"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
