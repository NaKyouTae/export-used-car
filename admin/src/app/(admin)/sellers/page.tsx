"use client";

import Link from "next/link";
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

const STATUS_LABELS: Record<string, string> = {
  PENDING: "승인대기",
  ACTIVE: "활성",
  SUSPENDED: "정지",
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
  return <span className={cls}>{STATUS_LABELS[status] ?? status}</span>;
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
      alert("판매자를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(null, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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
      alert("판매자 상태 변경에 실패했습니다");
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
          <option value="">전체 상태</option>
          <option value="ACTIVE">활성</option>
          <option value="SUSPENDED">정지</option>
        </select>
        <Link href="/users" className="btn btn-primary">
          사용자 전환하기 →
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>회사명</th>
                  <th>담당자</th>
                  <th>이메일</th>
                  <th>연락처</th>
                  <th>상태</th>
                  <th>차량 수</th>
                  <th>등록일</th>
                  <th>관리</th>
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
                          onClick={() => handleToggleStatus(s.id, s.status)}
                          className={`btn btn-sm ${s.status === "ACTIVE" ? "btn-danger" : "btn-primary"}`}
                        >
                          {s.status === "ACTIVE" ? "정지" : "활성화"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {sellers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-gray-400 py-8">
                      판매자가 없습니다.{" "}
                      <Link href="/users" className="text-blue-600 underline">
                        사용자
                      </Link>{" "}
                      페이지에서 전환해주세요.
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
                  더 보기
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
