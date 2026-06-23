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
      alert("사용자를 불러오지 못했습니다");
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
      alert("회사명 / 담당자 / 연락처를 입력해주세요");
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
        throw new Error(err?.message || "판매자 전환에 실패했습니다");
      }
      setPromoteTarget(null);
      setForm(initialForm);
      await load(null, true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "판매자 전환에 실패했습니다");
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
            <option value="">전체 역할</option>
            <option value="BUYER">구매자</option>
            <option value="SELLER">판매자</option>
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
              placeholder="이메일 / 이름 / 회사명 검색"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64"
            />
            <button type="submit" className="btn btn-secondary btn-sm">
              검색
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
                초기화
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>이메일</th>
                  <th>이름</th>
                  <th>국가</th>
                  <th>연락처</th>
                  <th>역할</th>
                  <th>가입일</th>
                  <th>관리</th>
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
                        <span className="badge-active">판매자</span>
                      ) : (
                        <span className="badge-draft">구매자</span>
                      )}
                    </td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      {u.role === "BUYER" ? (
                        <button
                          onClick={() => openPromoteModal(u)}
                          className="btn btn-primary btn-sm"
                        >
                          판매자로 전환
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">판매자</span>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-8">
                      사용자가 없습니다
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

      {promoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-1">판매자로 전환</h2>
            <p className="text-sm text-gray-500 mb-4">
              {promoteTarget.email}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  회사명 <span className="text-red-500">*</span>
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
                  담당자 <span className="text-red-500">*</span>
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
                  연락처 <span className="text-red-500">*</span>
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
                  사업자등록번호
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
                  주소
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
                취소
              </button>
              <button
                onClick={handlePromote}
                className="btn btn-primary"
                disabled={promoting}
              >
                {promoting ? "전환 중..." : "전환"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
