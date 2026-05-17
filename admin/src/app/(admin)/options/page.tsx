'use client';

import { Fragment, useEffect, useState } from 'react';
import Modal from '@/components/Modal';

interface OptionItem {
  id: string;
  name: string;
  nameKo?: string;
}

interface OptionCategory {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  items?: OptionItem[];
}

type CategoryModalMode = 'create' | 'edit' | null;
type ItemModalState = { categoryId: string; categoryName: string } | null;

export default function OptionsPage() {
  const [categories, setCategories] = useState<OptionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [catModalMode, setCatModalMode] = useState<CategoryModalMode>(null);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [itemModal, setItemModal] = useState<ItemModalState>(null);
  const [submitting, setSubmitting] = useState(false);

  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catOrder, setCatOrder] = useState(0);

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

  const resetCategoryForm = () => {
    setCatName('');
    setCatSlug('');
    setCatOrder(0);
    setEditCatId(null);
  };

  const openCreateCategory = () => {
    resetCategoryForm();
    setCatModalMode('create');
  };

  const openEditCategory = (c: OptionCategory) => {
    setEditCatId(c.id);
    setCatName(c.name);
    setCatSlug(c.slug);
    setCatOrder(c.displayOrder);
    setCatModalMode('edit');
  };

  const closeCatModal = () => {
    setCatModalMode(null);
    resetCategoryForm();
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = catModalMode === 'edit' ? `/api/options/${editCatId}` : '/api/options';
      const method = catModalMode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName, slug: catSlug, displayOrder: catOrder }),
      });
      if (!res.ok) throw new Error();
      closeCatModal();
      load();
    } catch {
      alert(catModalMode === 'edit' ? 'Failed to update option category' : 'Failed to add option category');
    } finally {
      setSubmitting(false);
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

  const openCreateItem = (categoryId: string, categoryName: string) => {
    setItemName('');
    setItemNameKo('');
    setItemModal({ categoryId, categoryName });
  };

  const closeItemModal = () => setItemModal(null);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemModal || !itemName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/option-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: itemName, nameKo: itemNameKo || undefined, categoryId: itemModal.categoryId }),
      });
      if (!res.ok) throw new Error();
      closeItemModal();
      load();
    } catch {
      alert('Failed to add option item');
    } finally {
      setSubmitting(false);
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{categories.length} option categories</p>
        <button onClick={openCreateCategory} className="btn btn-primary btn-sm">+ New Category</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No option categories yet</div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="admin-table hidden sm:table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Order</th>
                  <th>Items</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <Fragment key={c.id}>
                    <tr className="cursor-pointer" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                      <td className="w-8 text-center">
                        <span className={`inline-block transition-transform ${expandedId === c.id ? 'rotate-90' : ''}`}>
                          &#9654;
                        </span>
                      </td>
                      <td className="font-medium">{c.name}</td>
                      <td className="text-gray-500">{c.slug}</td>
                      <td>{c.displayOrder}</td>
                      <td>{c.items?.length ?? 0}</td>
                      <td className="text-right space-x-2">
                        <button onClick={(e) => { e.stopPropagation(); openEditCategory(c); }}
                          className="btn btn-secondary btn-sm">Edit</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c.id); }}
                          className="btn btn-danger btn-sm">Delete</button>
                      </td>
                    </tr>
                    {expandedId === c.id && (
                      <tr>
                        <td colSpan={6} className="bg-gray-50 p-4">
                          <ItemsPanel
                            category={c}
                            onAdd={() => openCreateItem(c.id, c.name)}
                            onDelete={handleDeleteItem}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <ul className="sm:hidden divide-y divide-gray-100">
              {categories.map((c) => (
                <li key={c.id} className="p-4 space-y-3">
                  <button
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    className="w-full flex items-start justify-between gap-3 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block text-xs transition-transform ${expandedId === c.id ? 'rotate-90' : ''}`}>&#9654;</span>
                        <p className="font-medium text-gray-900 truncate">{c.name}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">{c.slug}</p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">
                      {c.items?.length ?? 0} items · #{c.displayOrder}
                    </span>
                  </button>

                  {expandedId === c.id && (
                    <div className="bg-gray-50 -mx-4 px-4 py-3 border-t border-gray-100">
                      <ItemsPanel
                        category={c}
                        onAdd={() => openCreateItem(c.id, c.name)}
                        onDelete={handleDeleteItem}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => openEditCategory(c)} className="btn btn-secondary btn-sm flex-1">Edit</button>
                    <button onClick={() => handleDeleteCategory(c.id)} className="btn btn-danger btn-sm flex-1">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Category modal */}
      <Modal
        open={catModalMode !== null}
        onClose={closeCatModal}
        title={catModalMode === 'edit' ? 'Edit Option Category' : 'New Option Category'}
        footer={
          <>
            <button type="button" onClick={closeCatModal} className="btn btn-secondary btn-sm">Cancel</button>
            <button
              type="submit"
              form="option-cat-form"
              disabled={submitting}
              className="btn btn-primary btn-sm disabled:opacity-50"
            >
              {submitting ? 'Saving...' : catModalMode === 'edit' ? 'Save' : 'Create'}
            </button>
          </>
        }
      >
        <form id="option-cat-form" onSubmit={handleSubmitCategory} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              required
              autoFocus
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="Category name"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Slug</label>
            <input
              value={catSlug}
              onChange={(e) => setCatSlug(e.target.value)}
              required
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="category-slug"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Order</label>
            <input
              type="number"
              value={catOrder}
              onChange={(e) => setCatOrder(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-32"
            />
          </div>
        </form>
      </Modal>

      {/* Item modal */}
      <Modal
        open={itemModal !== null}
        onClose={closeItemModal}
        title={itemModal ? `New Item — ${itemModal.categoryName}` : 'New Item'}
        footer={
          <>
            <button type="button" onClick={closeItemModal} className="btn btn-secondary btn-sm">Cancel</button>
            <button
              type="submit"
              form="option-item-form"
              disabled={submitting}
              className="btn btn-primary btn-sm disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Create'}
            </button>
          </>
        }
      >
        <form id="option-item-form" onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
              autoFocus
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="Item name"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Korean Name</label>
            <input
              value={itemNameKo}
              onChange={(e) => setItemNameKo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="Korean name"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ItemsPanel({
  category,
  onAdd,
  onDelete,
}: {
  category: OptionCategory;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-600">Items in {category.name}</h4>
        <button onClick={onAdd} className="btn btn-primary btn-sm">+ Add Item</button>
      </div>
      <div className="space-y-1">
        {(category.items || []).map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm py-1 px-2 hover:bg-gray-100 rounded">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-medium truncate">{item.name}</span>
              {item.nameKo && <span className="text-gray-400 truncate">{item.nameKo}</span>}
            </div>
            <button onClick={() => onDelete(item.id)} className="text-red-500 hover:text-red-700 text-xs shrink-0">
              Delete
            </button>
          </div>
        ))}
        {(!category.items || category.items.length === 0) && (
          <p className="text-gray-400 text-sm">No items yet</p>
        )}
      </div>
    </div>
  );
}
