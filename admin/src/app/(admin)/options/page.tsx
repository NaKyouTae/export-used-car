'use client';

import { useEffect, useState } from 'react';

interface OptionItem {
  id: string;
  name: string;
  nameKo?: string;
}

interface OptionCategory {
  id: string;
  name: string;
  nameKo?: string;
  displayOrder: number;
  items?: OptionItem[];
}

export default function OptionsPage() {
  const [categories, setCategories] = useState<OptionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add category form
  const [catName, setCatName] = useState('');
  const [catNameKo, setCatNameKo] = useState('');
  const [catOrder, setCatOrder] = useState(0);

  // Edit category
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatNameKo, setEditCatNameKo] = useState('');
  const [editCatOrder, setEditCatOrder] = useState(0);

  // Add item form
  const [itemName, setItemName] = useState('');
  const [itemNameKo, setItemNameKo] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/options');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.data || []);
    } catch {
      alert('Failed to load option categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { const fetchData = async () => { await load(); }; fetchData(); }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName, nameKo: catNameKo || undefined, displayOrder: catOrder }),
      });
      if (!res.ok) throw new Error();
      setCatName(''); setCatNameKo(''); setCatOrder(0);
      load();
    } catch {
      alert('Failed to add option category');
    }
  };

  const handleUpdateCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/options/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editCatName, nameKo: editCatNameKo || undefined, displayOrder: editCatOrder }),
      });
      if (!res.ok) throw new Error();
      setEditCatId(null);
      load();
    } catch {
      alert('Failed to update option category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete this option category and all its items?')) return;
    try {
      const res = await fetch(`/api/options/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error();
      load();
    } catch {
      alert('Failed to delete option category');
    }
  };

  const startEditCategory = (c: OptionCategory) => {
    setEditCatId(c.id);
    setEditCatName(c.name);
    setEditCatNameKo(c.nameKo || '');
    setEditCatOrder(c.displayOrder);
  };

  const handleAddItem = async (categoryId: string) => {
    if (!itemName.trim()) return;
    try {
      const res = await fetch('/api/option-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: itemName, nameKo: itemNameKo || undefined, optionCategoryId: categoryId }),
      });
      if (!res.ok) throw new Error();
      setItemName(''); setItemNameKo('');
      load();
    } catch {
      alert('Failed to add option item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Delete this option item?')) return;
    try {
      const res = await fetch(`/api/option-items/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error();
      load();
    } catch {
      alert('Failed to delete option item');
    }
  };

  return (
    <div className="space-y-4">
      {/* Add category form */}
      <form onSubmit={handleAddCategory} className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Name</label>
          <input value={catName} onChange={(e) => setCatName(e.target.value)} required
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Category name" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Korean Name</label>
          <input value={catNameKo} onChange={(e) => setCatNameKo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Korean name" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Order</label>
          <input type="number" value={catOrder} onChange={(e) => setCatOrder(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20" />
        </div>
        <button type="submit" className="btn btn-primary btn-sm">Add Category</button>
      </form>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Korean Name</th>
                <th>Order</th>
                <th>Items</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <>
                  {editCatId === c.id ? (
                    <tr key={c.id}>
                      <td></td>
                      <td><input value={editCatName} onChange={(e) => setEditCatName(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full" /></td>
                      <td><input value={editCatNameKo} onChange={(e) => setEditCatNameKo(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full" /></td>
                      <td><input type="number" value={editCatOrder} onChange={(e) => setEditCatOrder(Number(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-20" /></td>
                      <td></td>
                      <td className="space-x-2">
                        <button onClick={() => handleUpdateCategory(c.id)} className="btn btn-primary btn-sm">Save</button>
                        <button onClick={() => setEditCatId(null)} className="btn btn-secondary btn-sm">Cancel</button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={c.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                      <td className="w-8 text-center">
                        <span className={`inline-block transition-transform ${expandedId === c.id ? 'rotate-90' : ''}`}>
                          &#9654;
                        </span>
                      </td>
                      <td className="font-medium">{c.name}</td>
                      <td className="text-gray-500">{c.nameKo || '-'}</td>
                      <td>{c.displayOrder}</td>
                      <td>{c.items?.length ?? 0}</td>
                      <td className="space-x-2">
                        <button onClick={(e) => { e.stopPropagation(); startEditCategory(c); }}
                          className="btn btn-secondary btn-sm">Edit</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c.id); }}
                          className="btn btn-danger btn-sm">Delete</button>
                      </td>
                    </tr>
                  )}
                  {expandedId === c.id && editCatId !== c.id && (
                    <tr key={`${c.id}-items`}>
                      <td colSpan={6} className="bg-gray-50 p-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-600">Items in {c.name}</h4>
                          {/* Add item form */}
                          <div className="flex gap-2 items-end">
                            <input value={itemName} onChange={(e) => setItemName(e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Item name" />
                            <input value={itemNameKo} onChange={(e) => setItemNameKo(e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Korean name" />
                            <button onClick={() => handleAddItem(c.id)} className="btn btn-primary btn-sm">
                              Add Item
                            </button>
                          </div>
                          {/* Item list */}
                          <div className="space-y-1">
                            {(c.items || []).map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-sm py-1 px-2 hover:bg-gray-100 rounded">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium">{item.name}</span>
                                  {item.nameKo && <span className="text-gray-400">{item.nameKo}</span>}
                                </div>
                                <button onClick={() => handleDeleteItem(item.id)}
                                  className="text-red-500 hover:text-red-700 text-xs">Delete</button>
                              </div>
                            ))}
                            {(!c.items || c.items.length === 0) && (
                              <p className="text-gray-400 text-sm">No items yet</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-8">No option categories yet</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
