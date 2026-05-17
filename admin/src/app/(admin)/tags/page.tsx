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
      alert('Failed to load tags');
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
      alert(modalMode === 'edit' ? 'Failed to update tag' : 'Failed to add tag');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this tag?')) return;
    try {
      const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error();
      load();
    } catch {
      alert('Failed to delete tag');
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
      alert('Failed to reorder');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{tags.length} tags · drag to reorder</p>
        <button onClick={openCreate} className="btn btn-primary btn-sm">+ New</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : tags.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No tags yet</div>
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
                    <button onClick={() => openEdit(t)} className="btn btn-secondary btn-sm">Edit</button>
                    <button onClick={() => handleDelete(t.id)} className="btn btn-danger btn-sm">Delete</button>
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
        title={modalMode === 'edit' ? 'Edit Tag' : 'New Tag'}
        footer={
          <>
            <button type="button" onClick={closeModal} className="btn btn-secondary btn-sm">Cancel</button>
            <button
              type="submit"
              form="tag-form"
              disabled={submitting}
              className="btn btn-primary btn-sm disabled:opacity-50"
            >
              {submitting ? 'Saving...' : modalMode === 'edit' ? 'Save' : 'Create'}
            </button>
          </>
        }
      >
        <form id="tag-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="Tag name"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Korean Name</label>
            <input
              value={nameKo}
              onChange={(e) => setNameKo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="Korean name"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
