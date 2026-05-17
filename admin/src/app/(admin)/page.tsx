'use client';

import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/datetime';

interface DashboardData {
  cars?: { total: number; byStatus: Record<string, number> };
  sellers?: { total: number; byStatus: Record<string, number> };
  users?: { total: number };
  buyers?: { total: number };
  recentSellers?: Array<{
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    status: string;
    createdAt: string;
  }>;
  recentCars?: Array<{
    id: string;
    title: string;
    price?: number | string;
    status: string;
    createdAt: string;
    seller?: { companyName: string };
  }>;
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'PENDING' ? 'badge-pending'
    : status === 'ACTIVE' ? 'badge-active'
    : status === 'SUSPENDED' ? 'badge-suspended'
    : status === 'DRAFT' ? 'badge-draft'
    : status === 'SOLD' ? 'badge-sold'
    : status === 'HIDDEN' ? 'badge-hidden'
    : 'badge-draft';
  return <span className={cls}>{status}</span>;
}

function formatPrice(n?: number | string) {
  if (n == null) return '-';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return `$${num.toLocaleString()}`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .catch(() => alert('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Cars" value={data.cars?.total ?? 0} sub={data.cars?.byStatus} />
        <StatCard label="Total Users" value={data.users?.total ?? 0} />
        <StatCard label="Total Sellers" value={data.sellers?.total ?? 0} sub={data.sellers?.byStatus} />
        <StatCard label="Total Buyers" value={data.buyers?.total ?? 0} />
      </div>

      {/* Recent sellers */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Recent Sellers</h3>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {(data.recentSellers || []).map((s) => (
              <tr key={s.id}>
                <td>{s.companyName}</td>
                <td>{s.contactName}</td>
                <td>{s.email}</td>
                <td><StatusBadge status={s.status} /></td>
                <td>{formatDate(s.createdAt)}</td>
              </tr>
            ))}
            {(!data.recentSellers || data.recentSellers.length === 0) && (
              <tr><td colSpan={5} className="text-center text-gray-400 py-8">No sellers yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recent cars */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Recent Cars</h3>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Seller</th>
              <th>Price</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {(data.recentCars || []).map((c) => (
              <tr key={c.id}>
                <td>{c.title}</td>
                <td>{c.seller?.companyName || '-'}</td>
                <td>{formatPrice(c.price)}</td>
                <td><StatusBadge status={c.status} /></td>
                <td>{formatDate(c.createdAt)}</td>
              </tr>
            ))}
            {(!data.recentCars || data.recentCars.length === 0) && (
              <tr><td colSpan={5} className="text-center text-gray-400 py-8">No cars yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: Record<string, number>;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && (
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.entries(sub).map(([k, v]) => (
            <span key={k} className="text-xs text-gray-500">
              {k}: {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
