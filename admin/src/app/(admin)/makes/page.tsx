'use client';

import { useEffect, useState } from 'react';

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

export default function MakesPage() {
  const [makes, setMakes] = useState<Make[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [models, setModels] = useState<Record<string, Model[]>>({});

  // Add make form
  const [name, setName] = useState('');
  const [nameKo, setNameKo] = useState('');
  const [country, setCountry] = useState('');

  // Add model form
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

  const handleAddMake = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/makes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, nameKo: nameKo || undefined, country: country || undefined }),
      });
      if (!res.ok) throw new Error();
      setName(''); setNameKo(''); setCountry('');
      load();
    } catch {
      alert('Failed to add make');
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

  const handleAddModel = async (makeId: string) => {
    if (!modelName.trim()) return;
    try {
      const res = await fetch(`/api/makes/${makeId}/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, nameKo: modelNameKo || undefined }),
      });
      if (!res.ok) throw new Error();
      setModelName(''); setModelNameKo('');
      loadModels(makeId);
    } catch {
      alert('Failed to add model');
    }
  };

  return (
    <div className="space-y-4">
      {/* Add make form */}
      <form onSubmit={handleAddMake} className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Make name" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Korean Name</label>
          <input value={nameKo} onChange={(e) => setNameKo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Korean name" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Country</label>
          <input value={country} onChange={(e) => setCountry(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Country" />
        </div>
        <button type="submit" className="btn btn-primary btn-sm">Add Make</button>
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
                <th>Country</th>
                <th>Models</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {makes.map((m) => (
                <>
                  <tr key={m.id} className="cursor-pointer" onClick={() => toggleExpand(m.id)}>
                    <td className="w-8 text-center">
                      <span className={`inline-block transition-transform ${expandedId === m.id ? 'rotate-90' : ''}`}>
                        &#9654;
                      </span>
                    </td>
                    <td className="font-medium">{m.name}</td>
                    <td className="text-gray-500">{m.nameKo || '-'}</td>
                    <td>{m.country || '-'}</td>
                    <td>{m.modelCount ?? (m.models?.length ?? '-')}</td>
                    <td>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteMake(m.id); }}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {expandedId === m.id && (
                    <tr key={`${m.id}-models`}>
                      <td colSpan={6} className="bg-gray-50 p-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-gray-600">Models for {m.name}</h4>
                          {/* Add model form */}
                          <div className="flex gap-2 items-end">
                            <input value={modelName} onChange={(e) => setModelName(e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Model name" />
                            <input value={modelNameKo} onChange={(e) => setModelNameKo(e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Korean name" />
                            <button onClick={() => handleAddModel(m.id)} className="btn btn-primary btn-sm">
                              Add Model
                            </button>
                          </div>
                          {/* Model list */}
                          <div className="space-y-1">
                            {(models[m.id] || []).map((model) => (
                              <div key={model.id} className="flex items-center gap-3 text-sm py-1">
                                <span className="font-medium">{model.name}</span>
                                {model.nameKo && <span className="text-gray-400">{model.nameKo}</span>}
                              </div>
                            ))}
                            {models[m.id]?.length === 0 && (
                              <p className="text-gray-400 text-sm">No models yet</p>
                            )}
                            {!models[m.id] && (
                              <p className="text-gray-400 text-sm">Loading models...</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {makes.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-8">No makes yet</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
