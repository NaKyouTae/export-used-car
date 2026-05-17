'use client';

import { Fragment, useEffect, useState } from 'react';
import Modal from '@/components/Modal';

interface Model {
  id: string;
  name: string;
  nameKo?: string;
}

interface Make {
  id: string;
  name: string;
  nameKo?: string;
  country?: string;
  modelCount?: number;
  models?: Model[];
}

type MakeModalMode = 'create' | null;
type ModelModalState = { makeId: string; makeName: string } | null;

export default function MakesPage() {
  const [makes, setMakes] = useState<Make[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [models, setModels] = useState<Record<string, Model[]>>({});

  const [makeModalMode, setMakeModalMode] = useState<MakeModalMode>(null);
  const [modelModal, setModelModal] = useState<ModelModalState>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [nameKo, setNameKo] = useState('');
  const [country, setCountry] = useState('');

  const [modelName, setModelName] = useState('');
  const [modelNameKo, setModelNameKo] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/makes');
      const data = await res.json();
      setMakes(Array.isArray(data) ? data : data.data || []);
    } catch {
      alert('Failed to load makes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { const fetchData = async () => { await load(); }; fetchData(); }, []);

  const loadModels = async (makeId: string) => {
    try {
      const res = await fetch(`/api/makes/${makeId}/models`);
      const data = await res.json();
      setModels((prev) => ({ ...prev, [makeId]: Array.isArray(data) ? data : data.data || [] }));
    } catch {
      alert('Failed to load models');
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
    setNameKo('');
    setCountry('');
    setMakeModalMode('create');
  };

  const closeMakeModal = () => setMakeModalMode(null);

  const handleAddMake = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/makes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, nameKo: nameKo || undefined, country: country || undefined }),
      });
      if (!res.ok) throw new Error();
      closeMakeModal();
      load();
    } catch {
      alert('Failed to add make');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMake = async (id: string) => {
    if (!window.confirm('Delete this make?')) return;
    try {
      const res = await fetch(`/api/makes/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error();
      load();
    } catch {
      alert('Failed to delete make');
    }
  };

  const openCreateModel = (makeId: string, makeName: string) => {
    setModelName('');
    setModelNameKo('');
    setModelModal({ makeId, makeName });
  };

  const closeModelModal = () => setModelModal(null);

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelModal || !modelName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/makes/${modelModal.makeId}/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, nameKo: modelNameKo || undefined }),
      });
      if (!res.ok) throw new Error();
      const targetId = modelModal.makeId;
      closeModelModal();
      loadModels(targetId);
    } catch {
      alert('Failed to add model');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{makes.length} makes</p>
        <button onClick={openCreateMake} className="btn btn-primary btn-sm">+ New Make</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : makes.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No makes yet</div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="admin-table hidden sm:table">
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Korean Name</th>
                  <th>Country</th>
                  <th>Models</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {makes.map((m) => (
                  <Fragment key={m.id}>
                    <tr className="cursor-pointer" onClick={() => toggleExpand(m.id)}>
                      <td className="w-8 text-center">
                        <span className={`inline-block transition-transform ${expandedId === m.id ? 'rotate-90' : ''}`}>
                          &#9654;
                        </span>
                      </td>
                      <td className="font-medium">{m.name}</td>
                      <td className="text-gray-500">{m.nameKo || '-'}</td>
                      <td>{m.country || '-'}</td>
                      <td>{m.modelCount ?? (m.models?.length ?? '-')}</td>
                      <td className="text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteMake(m.id); }}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                    {expandedId === m.id && (
                      <tr>
                        <td colSpan={6} className="bg-gray-50 p-4">
                          <ModelsPanel
                            make={m}
                            items={models[m.id]}
                            onAdd={() => openCreateModel(m.id, m.name)}
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
              {makes.map((m) => (
                <li key={m.id} className="p-4 space-y-3">
                  <button
                    onClick={() => toggleExpand(m.id)}
                    className="w-full flex items-start justify-between gap-3 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-block text-xs transition-transform ${expandedId === m.id ? 'rotate-90' : ''}`}>&#9654;</span>
                        <p className="font-medium text-gray-900 truncate">{m.name}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {[m.nameKo, m.country].filter(Boolean).join(' · ') || '-'}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">
                      {m.modelCount ?? (m.models?.length ?? 0)} models
                    </span>
                  </button>

                  {expandedId === m.id && (
                    <div className="bg-gray-50 -mx-4 px-4 py-3 border-t border-gray-100">
                      <ModelsPanel
                        make={m}
                        items={models[m.id]}
                        onAdd={() => openCreateModel(m.id, m.name)}
                      />
                    </div>
                  )}

                  <button onClick={() => handleDeleteMake(m.id)} className="btn btn-danger btn-sm w-full">
                    Delete Make
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Make modal */}
      <Modal
        open={makeModalMode !== null}
        onClose={closeMakeModal}
        title="New Make"
        footer={
          <>
            <button type="button" onClick={closeMakeModal} className="btn btn-secondary btn-sm">Cancel</button>
            <button
              type="submit"
              form="make-form"
              disabled={submitting}
              className="btn btn-primary btn-sm disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Create'}
            </button>
          </>
        }
      >
        <form id="make-form" onSubmit={handleAddMake} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="Make name"
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
            <label className="block text-xs text-gray-500 mb-1">Country</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="Country"
            />
          </div>
        </form>
      </Modal>

      {/* Model modal */}
      <Modal
        open={modelModal !== null}
        onClose={closeModelModal}
        title={modelModal ? `New Model — ${modelModal.makeName}` : 'New Model'}
        footer={
          <>
            <button type="button" onClick={closeModelModal} className="btn btn-secondary btn-sm">Cancel</button>
            <button
              type="submit"
              form="model-form"
              disabled={submitting}
              className="btn btn-primary btn-sm disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Create'}
            </button>
          </>
        }
      >
        <form id="model-form" onSubmit={handleAddModel} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name</label>
            <input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              required
              autoFocus
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="Model name"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Korean Name</label>
            <input
              value={modelNameKo}
              onChange={(e) => setModelNameKo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              placeholder="Korean name"
            />
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
}: {
  make: Make;
  items: Model[] | undefined;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-600">Models for {make.name}</h4>
        <button onClick={onAdd} className="btn btn-primary btn-sm">+ Add Model</button>
      </div>
      <div className="space-y-1">
        {(items || []).map((model) => (
          <div key={model.id} className="flex items-center gap-3 text-sm py-1">
            <span className="font-medium">{model.name}</span>
            {model.nameKo && <span className="text-gray-400">{model.nameKo}</span>}
          </div>
        ))}
        {items && items.length === 0 && (
          <p className="text-gray-400 text-sm">No models yet</p>
        )}
        {!items && (
          <p className="text-gray-400 text-sm">Loading models...</p>
        )}
      </div>
    </div>
  );
}
