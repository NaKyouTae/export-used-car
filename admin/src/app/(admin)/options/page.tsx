'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { SortableList } from '@/components/SortableList';

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
        body: JSON.stringify({ name: catName, slug: catSlug }),
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

  const handleReorderCategories = async (next: OptionCategory[]) => {
    const previous = categories;
    setCategories(next);
    try {
      const res = await fetch('/api/options/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((c) => c.id) }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setCategories(previous);
      alert('Failed to reorder categories');
    }
  };

  const handleReorderItems = async (categoryId: string, next: OptionItem[]) => {
    const previous = categories;
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, items: next } : c))
    );
    try {
      const res = await fetch(`/api/options/${categoryId}/items/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((i) => i.id) }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setCategories(previous);
      alert('Failed to reorder items');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{categories.length} option categories · drag to reorder</p>
        <button onClick={openCreateCategory} className="btn btn-primary btn-sm">+ New Category</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No option categories yet</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            <SortableList
              items={categories}
              onReorder={handleReorderCategories}
              renderItem={(c, handle) => (
                <li className="bg-white p-3 sm:p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {handle}
                    <button
                      onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                      className="flex-1 flex items-center gap-2 text-left min-w-0"
                    >
                      <span className={`inline-block text-xs transition-transform ${expandedId === c.id ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{c.name}</p>
                        <p className="text-xs text-gray-500 truncate">{c.slug}</p>
                      </div>
                      <span className="shrink-0 text-xs text-gray-400">
                        {c.items?.length ?? 0} items
                      </span>
                    </button>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => openEditCategory(c)} className="btn btn-secondary btn-sm">Edit</button>
                      <button onClick={() => handleDeleteCategory(c.id)} className="btn btn-danger btn-sm">Delete</button>
                    </div>
                  </div>

                  {expandedId === c.id && (
                    <div className="bg-gray-50 -mx-3 sm:-mx-4 px-3 sm:px-4 py-3 border-t border-gray-100">
                      <ItemsPanel
                        category={c}
                        onAdd={() => openCreateItem(c.id, c.name)}
                        onDelete={handleDeleteItem}
                        onReorder={(next) => handleReorderItems(c.id, next)}
                      />
                    </div>
                  )}
                </li>
              )}
            />
          </ul>
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
  onReorder,
}: {
  category: OptionCategory;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onReorder: (next: OptionItem[]) => void;
}) {
  const items = category.items || [];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-600">Items in {category.name}</h4>
        <button onClick={onAdd} className="btn btn-primary btn-sm">+ Add Item</button>
      </div>
      <div className="bg-white rounded-lg overflow-hidden">
        {items.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            <SortableList
              items={items}
              onReorder={onReorder}
              renderItem={(item, handle) => (
                <li className="bg-white px-3 py-2 flex items-center gap-3 text-sm">
                  {handle}
                  <div className="min-w-0 flex-1">
                    <span className="font-medium truncate">{item.name}</span>
                    {item.nameKo && <span className="ml-2 text-gray-400 truncate">{item.nameKo}</span>}
                  </div>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-red-500 hover:text-red-700 text-xs shrink-0"
                  >
                    Delete
                  </button>
                </li>
              )}
            />
          </ul>
        ) : (
          <p className="text-gray-400 text-sm px-3 py-2">No items yet</p>
        )}
      </div>
    </div>
  );
}
