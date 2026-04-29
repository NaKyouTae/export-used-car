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

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/sellers/${id}/verify`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error();
      setSellers((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: "ACTIVE", isVerified: true } : s
        )
      );
    } catch {
      alert("Failed to approve seller");
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
      <div className="flex items-center gap-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="PENDING">PENDING</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>
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
                      {s.status === "PENDING" && (
                        <button
                          onClick={() => handleApprove(s.id)}
                          className="btn btn-primary btn-sm"
                        >
                          Approve
                        </button>
                      )}
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
    </div>
  );
}
