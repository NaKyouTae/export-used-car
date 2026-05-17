'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';

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
  const [displayOrder, setDisplayOrder] = useState(0);

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
    setDisplayOrder(0);
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
    setDisplayOrder(t.displayOrder);
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
        body: JSON.stringify({ name, nameKo: nameKo || undefined, displayOrder }),
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{tags.length} tags</p>
        <button onClick={openCreate} className="btn btn-primary btn-sm">+ New</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : tags.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No tags yet</div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="admin-table hidden sm:table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Korean Name</th>
                  <th>Order</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((t) => (
                  <tr key={t.id}>
                    <td className="font-medium">{t.name}</td>
                    <td className="text-gray-500">{t.nameKo || '-'}</td>
                    <td>{t.displayOrder}</td>
                    <td className="text-right space-x-2">
                      <button onClick={() => openEdit(t)} className="btn btn-secondary btn-sm">Edit</button>
                      <button onClick={() => handleDelete(t.id)} className="btn btn-danger btn-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <ul className="sm:hidden divide-y divide-gray-100">
              {tags.map((t) => (
                <li key={t.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{t.name}</p>
                      {t.nameKo && <p className="text-xs text-gray-500 truncate">{t.nameKo}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">#{t.displayOrder}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(t)} className="btn btn-secondary btn-sm flex-1">Edit</button>
                    <button onClick={() => handleDelete(t.id)} className="btn btn-danger btn-sm flex-1">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </>
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
          <div>
            <label className="block text-xs text-gray-500 mb-1">Order</label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-32"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
