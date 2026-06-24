'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { SortableList } from '@/components/SortableList';

interface OptionItem {
  id: string;
  name: string;
  nameKo?: string;
  displayOrder: number;
}

type ModalMode = 'create' | 'edit' | null;

export default function OptionsPage() {
  const [items, setItems] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [nameKo, setNameKo] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/options');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.data || []);
    } catch {
      alert('옵션을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { const fetchData = async () => { await load(); }; fetchData(); }, []);

  const resetForm = () => {
    setName('');
    setNameKo('');
    setEditId(null);
  };

  const openCreate = () => {
    resetForm();
    setModalMode('create');
  };

  const openEdit = (item: OptionItem) => {
    setEditId(item.id);
    setName(item.name);
    setNameKo(item.nameKo || '');
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const url = modalMode === 'edit' ? `/api/options/${editId}` : '/api/options';
      const method = modalMode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, nameKo: nameKo || undefined }),
      });
      if (!res.ok) throw new Error();
      closeModal();
      load();
    } catch {
      alert(modalMode === 'edit' ? '옵션 수정에 실패했습니다' : '옵션 추가에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 옵션을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/options/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error();
      load();
    } catch {
      alert('옵션 삭제에 실패했습니다');
    }
  };

  const handleReorder = async (next: OptionItem[]) => {
    const previous = items;
    setItems(next);
    try {
      const res = await fetch('/api/options/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((i) => i.id) }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setItems(previous);
      alert('순서 변경에 실패했습니다');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">옵션 {items.length}개 · 드래그하여 순서 변경</p>
        <button onClick={openCreate} className="btn btn-primary btn-sm">+ 옵션 추가</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-400">옵션이 없습니다</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            <SortableList
              items={items}
              onReorder={handleReorder}
              renderItem={(item, handle) => (
                <li className="bg-white p-3 sm:p-4 flex items-center gap-3">
                  {handle}
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-gray-900 truncate">{item.name}</span>
                    {item.nameKo && item.nameKo !== item.name && (
                      <span className="ml-2 text-sm text-gray-400 truncate">{item.nameKo}</span>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(item)} className="btn btn-secondary btn-sm">수정</button>
                    <button onClick={() => handleDelete(item.id)} className="btn btn-danger btn-sm">삭제</button>
                  </div>
                </li>
              )}
            />
          </ul>
        )}
      </div>

      {/* Option modal */}
      <Modal
        open={modalMode !== null}
        onClose={closeModal}
        title={modalMode === 'edit' ? '옵션 수정' : '옵션 추가'}
        footer={
          <>
            <button type="button" onClick={closeModal} className="btn btn-secondary btn-sm">취소</button>
            <button
              type="submit"
              form="option-form"
              disabled={submitting}
              className="btn btn-primary btn-sm disabled:opacity-50"
            >
              {submitting ? '저장 중...' : modalMode === 'edit' ? '저장' : '추가'}
            </button>
          </>
        }
      >
        <form id="option-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">이름 (영문)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="옵션명 (영문)"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">한글 이름</label>
            <input
              value={nameKo}
              onChange={(e) => setNameKo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="옵션명 (한글)"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
