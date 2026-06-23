'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { SortableList } from '@/components/SortableList';

interface Category {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
}

interface Make {
  id: string;
  name: string;
  country?: string;
  modelCount?: number;
  models?: Model[];
}

type MakeModalMode = 'create' | 'edit' | null;
type ModelModalState = {
  makeId: string;
  makeName: string;
  modelId?: string;
} | null;

export default function MakesPage() {
  const [makes, setMakes] = useState<Make[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [models, setModels] = useState<Record<string, Model[]>>({});

  const [makeModalMode, setMakeModalMode] = useState<MakeModalMode>(null);
  const [editMakeId, setEditMakeId] = useState<string | null>(null);
  const [modelModal, setModelModal] = useState<ModelModalState>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [country, setCountry] = useState('');

  const [modelName, setModelName] = useState('');
  const [modelCategoryId, setModelCategoryId] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/makes');
      const data = await res.json();
      setMakes(Array.isArray(data) ? data : data.data || []);
    } catch {
      alert('제조사를 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.data || []);
    } catch {
      // 차종 목록 없이도 모델 등록은 가능
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([load(), loadCategories()]);
    };
    fetchData();
  }, []);

  const loadModels = async (makeId: string) => {
    try {
      const res = await fetch(`/api/makes/${makeId}/models`);
      const data = await res.json();
      setModels((prev) => ({ ...prev, [makeId]: Array.isArray(data) ? data : data.data || [] }));
    } catch {
      alert('모델을 불러오지 못했습니다');
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!models[id]) loadModels(id);
    }
  };

  const openCreateMake = () => {
    setName('');
    setCountry('');
    setEditMakeId(null);
    setMakeModalMode('create');
  };

  const openEditMake = (make: Make) => {
    setName(make.name);
    setCountry(make.country || '');
    setEditMakeId(make.id);
    setMakeModalMode('edit');
  };

  const closeMakeModal = () => {
    setMakeModalMode(null);
    setEditMakeId(null);
  };

  const handleSubmitMake = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = makeModalMode === 'edit' && editMakeId;
      const res = await fetch(isEdit ? `/api/makes/${editMakeId}` : '/api/makes', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, country: country || undefined }),
      });
      if (!res.ok) throw new Error();
      closeMakeModal();
      load();
    } catch {
      alert(makeModalMode === 'edit' ? '제조사 수정에 실패했습니다' : '제조사 추가에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMake = async (id: string) => {
    if (!window.confirm('이 제조사를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/makes/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error();
      load();
    } catch {
      alert('제조사 삭제에 실패했습니다');
    }
  };

  const openCreateModel = (makeId: string, makeName: string) => {
    setModelName('');
    setModelCategoryId('');
    setModelModal({ makeId, makeName });
  };

  const openEditModel = (makeId: string, makeName: string, model: Model) => {
    setModelName(model.name);
    setModelCategoryId(model.categoryId || '');
    setModelModal({ makeId, makeName, modelId: model.id });
  };

  const closeModelModal = () => setModelModal(null);

  const handleSubmitModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelModal || !modelName.trim()) return;
    setSubmitting(true);
    try {
      const isEdit = !!modelModal.modelId;
      const url = isEdit
        ? `/api/car-models/${modelModal.modelId}`
        : `/api/makes/${modelModal.makeId}/models`;
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modelName,
          categoryId: modelCategoryId || null,
        }),
      });
      if (!res.ok) throw new Error();
      const targetId = modelModal.makeId;
      closeModelModal();
      loadModels(targetId);
    } catch {
      alert(modelModal.modelId ? '모델 수정에 실패했습니다' : '모델 추가에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteModel = async (makeId: string, modelId: string) => {
    if (!window.confirm('이 모델을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/car-models/${modelId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error();
      loadModels(makeId);
    } catch {
      alert('모델 삭제에 실패했습니다');
    }
  };

  const handleReorderMakes = async (next: Make[]) => {
    const previous = makes;
    setMakes(next);
    try {
      const res = await fetch('/api/makes/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((m) => m.id) }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setMakes(previous);
      alert('제조사 순서 변경에 실패했습니다');
    }
  };

  const handleReorderModels = async (makeId: string, next: Model[]) => {
    const previous = models[makeId];
    setModels((prev) => ({ ...prev, [makeId]: next }));
    try {
      const res = await fetch(`/api/makes/${makeId}/models/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((m) => m.id) }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setModels((prev) => ({ ...prev, [makeId]: previous || [] }));
      alert('모델 순서 변경에 실패했습니다');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">제조사 {makes.length}개 · 드래그하여 순서 변경</p>
        <button onClick={openCreateMake} className="btn btn-primary btn-sm">+ 제조사 추가</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">불러오는 중...</div>
        ) : makes.length === 0 ? (
          <div className="p-8 text-center text-gray-400">제조사가 없습니다</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            <SortableList
              items={makes}
              onReorder={handleReorderMakes}
              renderItem={(m, handle) => (
                <li className="bg-white p-3 sm:p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {handle}
                    <button
                      onClick={() => toggleExpand(m.id)}
                      className="flex-1 flex items-center gap-2 text-left min-w-0"
                    >
                      <span className={`inline-block text-xs transition-transform ${expandedId === m.id ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{m.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {m.country || '-'}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-gray-400">
                        모델 {m.modelCount ?? (m.models?.length ?? 0)}개
                      </span>
                    </button>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => openEditMake(m)}
                        className="btn btn-secondary btn-sm"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteMake(m.id)}
                        className="btn btn-danger btn-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  {expandedId === m.id && (
                    <div className="bg-gray-50 -mx-3 sm:-mx-4 px-3 sm:px-4 py-3 border-t border-gray-100">
                      <ModelsPanel
                        make={m}
                        items={models[m.id]}
                        onAdd={() => openCreateModel(m.id, m.name)}
                        onEdit={(model) => openEditModel(m.id, m.name, model)}
                        onDelete={(modelId) => handleDeleteModel(m.id, modelId)}
                        onReorder={(next) => handleReorderModels(m.id, next)}
                      />
                    </div>
                  )}
                </li>
              )}
            />
          </ul>
        )}
      </div>

      {/* Make modal */}
      <Modal
        open={makeModalMode !== null}
        onClose={closeMakeModal}
        title={makeModalMode === 'edit' ? '제조사 수정' : '제조사 추가'}
        footer={
          <>
            <button type="button" onClick={closeMakeModal} className="btn btn-secondary btn-sm">취소</button>
            <button
              type="submit"
              form="make-form"
              disabled={submitting}
              className="btn btn-primary btn-sm disabled:opacity-50"
            >
              {submitting ? '저장 중...' : makeModalMode === 'edit' ? '저장' : '추가'}
            </button>
          </>
        }
      >
        <form id="make-form" onSubmit={handleSubmitMake} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">이름</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="제조사명 (영문)"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">국가</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="국가"
            />
          </div>
        </form>
      </Modal>

      {/* Model modal */}
      <Modal
        open={modelModal !== null}
        onClose={closeModelModal}
        title={
          modelModal
            ? `${modelModal.modelId ? '모델 수정' : '모델 추가'} — ${modelModal.makeName}`
            : '모델 추가'
        }
        footer={
          <>
            <button type="button" onClick={closeModelModal} className="btn btn-secondary btn-sm">취소</button>
            <button
              type="submit"
              form="model-form"
              disabled={submitting}
              className="btn btn-primary btn-sm disabled:opacity-50"
            >
              {submitting ? '저장 중...' : modelModal?.modelId ? '저장' : '추가'}
            </button>
          </>
        }
      >
        <form id="model-form" onSubmit={handleSubmitModel} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">이름</label>
            <input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              required
              autoFocus
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="모델명 (영문)"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">차종</label>
            <select
              value={modelCategoryId}
              onChange={(e) => setModelCategoryId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full bg-white"
            >
              <option value="">선택 안 함</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              모델의 차종을 지정하면 차량 등록 시 자동으로 적용됩니다.
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ModelsPanel({
  make,
  items,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}: {
  make: Make;
  items: Model[] | undefined;
  onAdd: () => void;
  onEdit: (model: Model) => void;
  onDelete: (modelId: string) => void;
  onReorder: (next: Model[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-600">{make.name} 모델</h4>
        <button onClick={onAdd} className="btn btn-primary btn-sm">+ 모델 추가</button>
      </div>
      <div className="bg-white rounded-lg overflow-hidden">
        {items && items.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            <SortableList
              items={items}
              onReorder={onReorder}
              renderItem={(model, handle) => (
                <li className="bg-white px-3 py-2 flex items-center gap-3 text-sm">
                  {handle}
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{model.name}</span>
                  </div>
                  {model.category?.name ? (
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {model.category.name}
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                      차종 미지정
                    </span>
                  )}
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => onEdit(model)} className="btn btn-secondary btn-sm">수정</button>
                    <button onClick={() => onDelete(model.id)} className="btn btn-danger btn-sm">삭제</button>
                  </div>
                </li>
              )}
            />
          </ul>
        ) : items ? (
          <p className="text-gray-400 text-sm px-3 py-2">모델이 없습니다</p>
        ) : (
          <p className="text-gray-400 text-sm px-3 py-2">모델 불러오는 중...</p>
        )}
      </div>
    </div>
  );
}
