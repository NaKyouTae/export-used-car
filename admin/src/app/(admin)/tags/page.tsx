'use client';

import { useEffect, useState } from 'react';

interface Tag {
  id: string;
  name: string;
  nameKo?: string;
  displayOrder: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [nameKo, setNameKo] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNameKo, setEditNameKo] = useState('');
  const [editOrder, setEditOrder] = useState(0);

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, nameKo: nameKo || undefined, displayOrder }),
      });
      if (!res.ok) throw new Error();
      setName(''); setNameKo(''); setDisplayOrder(0);
      load();
    } catch {
      alert('Failed to add tag');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, nameKo: editNameKo || undefined, displayOrder: editOrder }),
      });
      if (!res.ok) throw new Error();
      setEditId(null);
      load();
    } catch {
      alert('Failed to update tag');
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

  const startEdit = (t: Tag) => {
    setEditId(t.id);
    setEditName(t.name);
    setEditNameKo(t.nameKo || '');
    setEditOrder(t.displayOrder);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Tag name" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Korean Name</label>
          <input value={nameKo} onChange={(e) => setNameKo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Korean name" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Order</label>
          <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20" />
        </div>
        <button type="submit" className="btn btn-primary btn-sm">Add</button>
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Korean Name</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((t) =>
                editId === t.id ? (
                  <tr key={t.id}>
                    <td><input value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-full" /></td>
                    <td><input value={editNameKo} onChange={(e) => setEditNameKo(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-full" /></td>
                    <td><input type="number" value={editOrder} onChange={(e) => setEditOrder(Number(e.target.value))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-20" /></td>
                    <td className="space-x-2">
                      <button onClick={() => handleUpdate(t.id)} className="btn btn-primary btn-sm">Save</button>
                      <button onClick={() => setEditId(null)} className="btn btn-secondary btn-sm">Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={t.id}>
                    <td className="font-medium">{t.name}</td>
                    <td className="text-gray-500">{t.nameKo || '-'}</td>
                    <td>{t.displayOrder}</td>
                    <td className="space-x-2">
                      <button onClick={() => startEdit(t)} className="btn btn-secondary btn-sm">Edit</button>
                      <button onClick={() => handleDelete(t.id)} className="btn btn-danger btn-sm">Delete</button>
                    </td>
                  </tr>
                )
              )}
              {tags.length === 0 && (
                <tr><td colSpan={4} className="text-center text-gray-400 py-8">No tags yet</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
