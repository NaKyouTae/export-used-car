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

const STATUS_LABELS: Record<string, string> = {
  PENDING: '승인대기',
  ACTIVE: '활성',
  SUSPENDED: '정지',
  DRAFT: '임시저장',
  DEALING: '거래중',
  SOLD: '거래완료',
  HIDDEN: '숨김',
  RESERVED: '예약중',
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'PENDING' ? 'badge-pending'
    : status === 'ACTIVE' ? 'badge-active'
    : status === 'SUSPENDED' ? 'badge-suspended'
    : status === 'DRAFT' ? 'badge-draft'
    : status === 'SOLD' ? 'badge-sold'
    : status === 'DEALING' ? 'badge-sold'
    : status === 'RESERVED' ? 'badge-sold'
    : status === 'HIDDEN' ? 'badge-hidden'
    : 'badge-draft';
  return <span className={cls}>{STATUS_LABELS[status] ?? status}</span>;
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
      .catch(() => alert('대시보드를 불러오지 못했습니다'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">불러오는 중...</div>;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="전체 차량" value={data.cars?.total ?? 0} sub={data.cars?.byStatus} />
        <StatCard label="전체 사용자" value={data.users?.total ?? 0} />
        <StatCard label="전체 판매자" value={data.sellers?.total ?? 0} sub={data.sellers?.byStatus} />
        <StatCard label="전체 구매자" value={data.buyers?.total ?? 0} />
      </div>

      {/* Recent sellers */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">최근 판매자</h3>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>회사명</th>
              <th>담당자</th>
              <th>이메일</th>
              <th>상태</th>
              <th>등록일</th>
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
              <tr><td colSpan={5} className="text-center text-gray-400 py-8">판매자가 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recent cars */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">최근 차량</h3>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>제목</th>
              <th>판매자</th>
              <th>가격</th>
              <th>상태</th>
              <th>등록일</th>
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
              <tr><td colSpan={5} className="text-center text-gray-400 py-8">차량이 없습니다</td></tr>
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
              {STATUS_LABELS[k] ?? k}: {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
