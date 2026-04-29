'use client';

import { useEffect, useState } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editOrder, setEditOrder] = useState(0);

  const load = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.data || []);
    } catch {
      alert('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { const fetchData = async () => { await load(); }; fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, displayOrder }),
      });
      if (!res.ok) throw new Error();
      setName(''); setSlug(''); setDisplayOrder(0);
      load();
    } catch {
      alert('Failed to add category');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, slug: editSlug, displayOrder: editOrder }),
      });
      if (!res.ok) throw new Error();
      setEditId(null);
      load();
    } catch {
      alert('Failed to update category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error();
      load();
    } catch {
      alert('Failed to delete category');
    }
  };

  const startEdit = (c: Category) => {
    setEditId(c.id);
    setEditName(c.name);
    setEditSlug(c.slug);
    setEditOrder(c.displayOrder);
  };

  return (
    <div className="space-y-4">
      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Category name" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Slug</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} required
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="category-slug" />
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
                <th>Slug</th>
                <th>Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) =>
                editId === c.id ? (
                  <tr key={c.id}>
                    <td><input value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-full" /></td>
                    <td><input value={editSlug} onChange={(e) => setEditSlug(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-full" /></td>
                    <td><input type="number" value={editOrder} onChange={(e) => setEditOrder(Number(e.target.value))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-20" /></td>
                    <td className="space-x-2">
                      <button onClick={() => handleUpdate(c.id)} className="btn btn-primary btn-sm">Save</button>
                      <button onClick={() => setEditId(null)} className="btn btn-secondary btn-sm">Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td className="text-gray-500">{c.slug}</td>
                    <td>{c.displayOrder}</td>
                    <td className="space-x-2">
                      <button onClick={() => startEdit(c)} className="btn btn-secondary btn-sm">Edit</button>
                      <button onClick={() => handleDelete(c.id)} className="btn btn-danger btn-sm">Delete</button>
                    </td>
                  </tr>
                )
              )}
              {categories.length === 0 && (
                <tr><td colSpan={4} className="text-center text-gray-400 py-8">No categories yet</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
