"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";

interface QuickPhrase {
  id: string;
  category: string;
  content: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface EditorState {
  mode: "create" | "edit";
  id?: string;
  category: string;
  content: string;
}

export default function QuickPhrasesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [phrases, setPhrases] = useState<QuickPhrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhrases = useCallback(async () => {
    const res = await fetch("/api/quick-phrases", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setPhrases(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPhrases();
  }, [authLoading, isAuthenticated, router, fetchPhrases]);

  const openCreate = () => {
    setError(null);
    setEditor({ mode: "create", category: "", content: "" });
  };

  const openEdit = (p: QuickPhrase) => {
    setError(null);
    setEditor({
      mode: "edit",
      id: p.id,
      category: p.category,
      content: p.content,
    });
  };

  const closeEditor = () => {
    if (saving) return;
    setEditor(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!editor) return;
    const content = editor.content.trim();
    if (!content) {
      setError("Please enter a phrase.");
      return;
    }
    setSaving(true);
    setError(null);

    const category = editor.category.trim() || "General";

    try {
      if (editor.mode === "create") {
        const res = await fetch("/api/quick-phrases", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content, category }),
        });
        if (!res.ok) throw new Error("Failed");
      } else if (editor.mode === "edit" && editor.id) {
        const res = await fetch(`/api/quick-phrases/${editor.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content, category }),
        });
        if (!res.ok) throw new Error("Failed");
      }
      await fetchPhrases();
      setEditor(null);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this phrase?")) return;
    const res = await fetch(`/api/quick-phrases/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setPhrases((prev) => prev.filter((p) => p.id !== id));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-dvh bg-white">
        <PageHeader title="Quick Phrases" />
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const grouped = groupByCategory(phrases);
  const categories = Object.keys(grouped);

  return (
    <div className="min-h-dvh bg-white pb-[88px]">
      <PageHeader title="Quick Phrases" />

      {phrases.length === 0 ? (
        <div className="px-6 pt-20 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-main-50 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-main-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            No quick phrases yet
          </h2>
          <p className="text-sm text-gray-500">
            Save phrases you use often in chats.
          </p>
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-4">
          {categories.map((cat) => (
            <section
              key={cat}
              className="bg-white rounded-xl overflow-hidden border border-gray-200"
            >
              <div className="px-4 py-2.5 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {cat}
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {grouped[cat].map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start gap-2 px-4 py-3"
                  >
                    <button
                      onClick={() => openEdit(p)}
                      className="flex-1 text-left text-sm text-gray-900 leading-relaxed active:opacity-60"
                    >
                      {p.content}
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      aria-label="Delete"
                      className="flex-shrink-0 p-1.5 text-gray-300 active:text-red-500"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Add button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-100 px-4 py-3 pb-safe">
        <button
          onClick={openCreate}
          className="w-full py-3 bg-main-600 text-white text-sm font-semibold rounded-xl active:bg-main-700"
        >
          + Add Phrase
        </button>
      </div>

      {editor && (
        <PhraseEditor
          state={editor}
          saving={saving}
          error={error}
          onChange={setEditor}
          onClose={closeEditor}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function groupByCategory(phrases: QuickPhrase[]) {
  const map: Record<string, QuickPhrase[]> = {};
  for (const p of phrases) {
    const key = p.category || "General";
    if (!map[key]) map[key] = [];
    map[key].push(p);
  }
  return map;
}

function PhraseEditor({
  state,
  saving,
  error,
  onChange,
  onClose,
  onSave,
}: {
  state: EditorState;
  saving: boolean;
  error: string | null;
  onChange: (s: EditorState) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-[390px] bg-white rounded-t-2xl px-4 pt-3 pb-safe">
        <div className="flex justify-center pb-2">
          <span className="block w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">
            {state.mode === "create" ? "New Phrase" : "Edit Phrase"}
          </h3>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-sm text-gray-400"
          >
            Cancel
          </button>
        </div>

        <div className="space-y-3 pb-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Category
            </label>
            <input
              type="text"
              value={state.category}
              onChange={(e) =>
                onChange({ ...state, category: e.target.value })
              }
              placeholder="General"
              maxLength={50}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-main-500 focus:ring-1 focus:ring-main-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Phrase
            </label>
            <textarea
              value={state.content}
              onChange={(e) =>
                onChange({ ...state, content: e.target.value })
              }
              placeholder="Type a phrase you use often..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 resize-none focus:outline-none focus:border-main-500 focus:ring-1 focus:ring-main-500"
            />
            <p className="mt-1 text-[11px] text-gray-400 text-right">
              {state.content.length}/500
            </p>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <button
          onClick={onSave}
          disabled={saving}
          className="w-full py-3 bg-main-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
