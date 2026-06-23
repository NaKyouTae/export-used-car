'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { SortableList } from '@/components/SortableList';

interface Category {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
}

type ModalMode = 'create' | 'edit' | null;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.data || []);
    } catch {
      alert('차종을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { const fetchData = async () => { await load(); }; fetchData(); }, []);

  const resetForm = () => {
    setName('');
    setEditId(null);
  };

  const openCreate = () => {
    resetForm();
    setModalMode('create');
  };

  const openEdit = (c: Category) => {
    setEditId(c.id);
    setName(c.name);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = modalMode === 'edit' ? `/api/categories/${editId}` : '/api/categories';
      const method = modalMode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
      closeModal();
      load();
    } catch {
      alert(modalMode === 'edit' ? '차종 수정에 실패했습니다' : '차종 추가에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 차종을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error();
      load();
    } catch {
      alert('차종 삭제에 실패했습니다');
    }
  };

  const handleReorder = async (next: Category[]) => {
    const previous = categories;
    setCategories(next);
    try {
      const res = await fetch('/api/categories/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((c) => c.id) }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setCategories(previous);
      alert('순서 변경에 실패했습니다');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">차종 {categories.length}개 · 드래그하여 순서 변경</p>
        <button onClick={openCreate} className="btn btn-primary btn-sm">+ 추가</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-400">차종이 없습니다</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            <SortableList
              items={categories}
              onReorder={handleReorder}
              renderItem={(c, handle) => (
                <li className="bg-white p-3 sm:p-4 flex items-center gap-3">
                  {handle}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 truncate">{c.slug}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(c)} className="btn btn-secondary btn-sm">수정</button>
                    <button onClick={() => handleDelete(c.id)} className="btn btn-danger btn-sm">삭제</button>
                  </div>
                </li>
              )}
            />
          </ul>
        )}
      </div>

      <Modal
        open={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'edit' ? '차종 수정' : '차종 추가'}
        footer={
          <>
            <button type="button" onClick={closeModal} className="btn btn-secondary btn-sm">취소</button>
            <button
              type="submit"
              form="category-form"
              disabled={submitting}
              className="btn btn-primary btn-sm disabled:opacity-50"
            >
              {submitting ? '저장 중...' : modalMode === 'edit' ? '저장' : '추가'}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">이름</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="세단, SUV, 트럭 등"
            />
            <p className="text-[11px] text-gray-400 mt-1">URL용 식별자(slug)는 이름으로 자동 생성됩니다.</p>
          </div>
        </form>
      </Modal>
    </div>
  );
}
