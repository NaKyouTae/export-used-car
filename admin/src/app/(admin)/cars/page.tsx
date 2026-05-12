"use client";

import { useEffect, useState } from "react";

interface Car {
  id: string;
  title: string;
  priceMin?: number | string;
  priceMax?: number | string;
  status: string;
  createdAt: string;
  viewCount: number;
  seller?: { companyName: string };
  make?: { name: string };
  carModel?: { name: string };
  thumbnail?: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "ACTIVE"
      ? "badge-active"
      : status === "HIDDEN"
        ? "badge-hidden"
        : status === "SOLD"
          ? "badge-sold"
          : status === "DRAFT"
            ? "badge-draft"
            : status === "RESERVED"
              ? "badge-sold"
              : "badge-draft";
  return <span className={cls}>{status}</span>;
}

function formatDate(s: string) {
  return s ? s.slice(0, 10) : "-";
}

function formatPrice(n?: number | string) {
  if (n == null) return "-";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (num >= 10000) {
    const man = Math.floor(num / 10000);
    const remainder = num % 10000;
    if (remainder === 0) return `${man.toLocaleString("ko-KR")}만원`;
    return `${man.toLocaleString("ko-KR")}만 ${remainder.toLocaleString("ko-KR")}원`;
  }
  return `${num.toLocaleString("ko-KR")}원`;
}

function formatPriceRange(min?: number | string, max?: number | string) {
  if (min == null && max == null) return "-";
  const minStr = formatPrice(min);
  const maxStr = formatPrice(max);
  if (minStr === maxStr) return minStr;
  return `${minStr} ~ ${maxStr}`;
}

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
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
      const res = await fetch(`/api/cars?${params}`);
      const data = await res.json();
      const items = data.data || [];

      if (reset) {
        setCars(Array.isArray(items) ? items : []);
      } else {
        setCars((prev) => [...prev, ...(Array.isArray(items) ? items : [])]);
      }
      setNextCursor(data.nextCursor || null);
    } catch {
      alert("Failed to load cars");
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

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/cars/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setCars((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
    } catch {
      alert("Failed to update car status");
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
          <option value="DRAFT">DRAFT</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="RESERVED">RESERVED</option>
          <option value="HIDDEN">HIDDEN</option>
          <option value="SOLD">SOLD</option>
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
                  <th>Title</th>
                  <th>Make / Model</th>
                  <th>Seller</th>
                  <th>Price</th>
                  <th>Views</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cars.map((c) => (
                  <tr key={c.id}>
                    <td className="max-w-[200px] truncate">{c.title}</td>
                    <td>
                      {c.make?.name || "-"} {c.carModel?.name || ""}
                    </td>
                    <td>{c.seller?.companyName || "-"}</td>
                    <td>{formatPriceRange(c.priceMin, c.priceMax)}</td>
                    <td>{c.viewCount}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>{formatDate(c.createdAt)}</td>
                    <td>
                      <select
                        value={c.status}
                        onChange={(e) =>
                          handleStatusChange(c.id, e.target.value)
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="RESERVED">RESERVED</option>
                        <option value="HIDDEN">HIDDEN</option>
                        <option value="SOLD">SOLD</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {cars.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-gray-400 py-8">
                      No cars found
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
