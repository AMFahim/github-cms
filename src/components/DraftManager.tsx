"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Draft,
  DraftInput,
  createDraft,
  updateDraft,
  deleteDraft,
  validateDraft,
  getDraftsSortedByUpdated,
} from "@/lib/drafts";

interface DraftFormProps {
  draft?: Draft;
  onSubmit: (input: DraftInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

function DraftForm({ draft, onSubmit, onCancel, loading }: DraftFormProps) {
  const [title, setTitle] = useState(draft?.title || "");
  const [body, setBody] = useState(draft?.body || "");
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const draftInput: DraftInput = { title, body };
    const validationErrors = validateDraft(draftInput);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    onSubmit(draftInput);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {draft ? "Edit Draft" : "Create New Draft"}
      </h3>

      {errors.length > 0 && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                Validation Errors
              </h3>
              <ul className="mt-1 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                       focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white
                       disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            placeholder="Enter title..."
            disabled={loading}
            required
          />
        </div>

        <div>
          <label
            htmlFor="body"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Content
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                       focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white
                       disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            placeholder="Enter markdown content..."
            disabled={loading}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md 
                       shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
                       focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : draft ? "Update Draft" : "Create Draft"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 
                       text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 
                       hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 
                       focus:ring-offset-2 focus:ring-blue-500 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function DraftManager() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  useEffect(() => {
    setDrafts(getDraftsSortedByUpdated());
  }, []);

  const handleCreateDraft = (input: DraftInput) => {
    createDraft(input);
    setDrafts(getDraftsSortedByUpdated());
    setShowCreateForm(false);
  };

  const handleUpdateDraft = (input: DraftInput) => {
    if (!editingDraft) return;

    const updatedDraft = updateDraft(editingDraft.id, input);
    if (updatedDraft) {
      setDrafts(getDraftsSortedByUpdated());
      setEditingDraft(null);
    }
  };

  const handleDeleteDraft = (id: string) => {
    deleteDraft(id);
    setDrafts(getDraftsSortedByUpdated());
    if (editingDraft?.id === id) {
      setEditingDraft(null);
    }
  };

  const handlePublishAll = async () => {
    if (drafts.length === 0) {
      setPublishError("No drafts to publish");
      return;
    }

    setPublishing(true);
    setPublishError(null);
    setPublishSuccess(null);

    try {
      const response = await fetch("/api/github/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ drafts }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to publish drafts");
      }

      setPublishSuccess(
        `Successfully published ${data.data.total} draft(s) to GitHub!`
      );
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Draft Management ({drafts.length} drafts)
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md 
                         shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-green-500"
            >
              New Draft
            </button>

            <button
              onClick={handlePublishAll}
              disabled={publishing || drafts.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md 
                         shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {publishing ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Publishing...
                </>
              ) : (
                `Publish All (${drafts.length})`
              )}
            </button>
          </div>
        </div>

        {publishError && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  Publish Error
                </h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {publishError}
                </p>
              </div>
            </div>
          </div>
        )}

        {publishSuccess && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-400">
                  Success!
                </h3>
                <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                  {publishSuccess}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCreateForm && (
        <DraftForm
          onSubmit={handleCreateDraft}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingDraft && (
        <DraftForm
          draft={editingDraft}
          onSubmit={handleUpdateDraft}
          onCancel={() => setEditingDraft(null)}
        />
      )}

      <div className="space-y-4">
        {drafts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No drafts yet. Create your first draft to get started!
            </p>
          </div>
        ) : (
          drafts.map((draft) => (
            <div
              key={draft.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {draft.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Created {format(draft.createdAt, "MMM d, yyyy")} • Updated{" "}
                    {format(draft.updatedAt, "MMM d, yyyy")}
                  </p>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    {draft.body.length > 200
                      ? `${draft.body.substring(0, 200)}...`
                      : draft.body || "No content"}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setEditingDraft(draft)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 
                               text-sm font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 
                               hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 
                               focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteDraft(draft.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 dark:border-red-600 
                               text-sm font-medium rounded text-red-700 dark:text-red-300 bg-white dark:bg-red-900/20 
                               hover:bg-red-50 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 
                               focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
