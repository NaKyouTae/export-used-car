'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { SortableList } from '@/components/SortableList';

interface Tag {
  id: string;
  name: string;
  nameKo?: string;
  displayOrder: number;
}

type ModalMode = 'create' | 'edit' | null;

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [nameKo, setNameKo] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/tags');
      const data = await res.json();
      setTags(Array.isArray(data) ? data : data.data || []);
    } catch {
      alert('태그를 불러오지 못했습니다');
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

  const openEdit = (t: Tag) => {
    setEditId(t.id);
    setName(t.name);
    setNameKo(t.nameKo || '');
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
      const url = modalMode === 'edit' ? `/api/tags/${editId}` : '/api/tags';
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
      alert(modalMode === 'edit' ? '태그 수정에 실패했습니다' : '태그 추가에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 태그를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error();
      load();
    } catch {
      alert('태그 삭제에 실패했습니다');
    }
  };

  const handleReorder = async (next: Tag[]) => {
    const previous = tags;
    setTags(next);
    try {
      const res = await fetch('/api/tags/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((t) => t.id) }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTags(previous);
      alert('순서 변경에 실패했습니다');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">태그 {tags.length}개 · 드래그하여 순서 변경</p>
        <button onClick={openCreate} className="btn btn-primary btn-sm">+ 추가</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : tags.length === 0 ? (
          <div className="p-8 text-center text-gray-400">태그가 없습니다</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            <SortableList
              items={tags}
              onReorder={handleReorder}
              renderItem={(t, handle) => (
                <li className="bg-white p-3 sm:p-4 flex items-center gap-3">
                  {handle}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{t.name}</p>
                    {t.nameKo && <p className="text-xs text-gray-500 truncate">{t.nameKo}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(t)} className="btn btn-secondary btn-sm">수정</button>
                    <button onClick={() => handleDelete(t.id)} className="btn btn-danger btn-sm">삭제</button>
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
        title={modalMode === 'edit' ? '태그 수정' : '태그 추가'}
        footer={
          <>
            <button type="button" onClick={closeModal} className="btn btn-secondary btn-sm">취소</button>
            <button
              type="submit"
              form="tag-form"
              disabled={submitting}
              className="btn btn-primary btn-sm disabled:opacity-50"
            >
              {submitting ? '저장 중...' : modalMode === 'edit' ? '저장' : '추가'}
            </button>
          </>
        }
      >
        <form id="tag-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">이름</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="태그명 (영문)"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">한글 이름</label>
            <input
              value={nameKo}
              onChange={(e) => setNameKo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="태그명 (한글)"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
