import { format } from 'date-fns';

export interface Draft {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DraftInput {
  title: string;
  body: string;
}

const DRAFTS_STORAGE_KEY = 'github-cms-drafts';

export function generateId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function loadDrafts(): Draft[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const drafts = JSON.parse(stored) as Draft[];
    return drafts.map((draft) => ({
      ...draft,
      createdAt: new Date(draft.createdAt),
      updatedAt: new Date(draft.updatedAt),
    }));
  } catch (error) {
    console.error('Error loading drafts from localStorage:', error);
    return [];
  }
}

/**
 * Save drafts to localStorage
 */
export function saveDrafts(drafts: Draft[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  } catch (error) {
    console.error('Error saving drafts to localStorage:', error);
    throw new Error('Failed to save drafts. Storage may be full.');
  }
}

/**
 * Create a new draft
 */
export function createDraft(input: DraftInput): Draft {
  const now = new Date();
  const draft: Draft = {
    id: generateId(),
    title: input.title || 'Untitled Draft',
    body: input.body || '',
    createdAt: now,
    updatedAt: now,
  };

  const drafts = loadDrafts();
  drafts.unshift(draft); // Add to beginning of array
  saveDrafts(drafts);

  return draft;
}

/**
 * Update an existing draft
 */
export function updateDraft(id: string, updates: Partial<DraftInput>): Draft | null {
  const drafts = loadDrafts();
  const draftIndex = drafts.findIndex(d => d.id === id);

  if (draftIndex === -1) {
    return null;
  }

  const draft = drafts[draftIndex];
  const updatedDraft: Draft = {
    ...draft,
    ...updates,
    updatedAt: new Date(),
  };

  drafts[draftIndex] = updatedDraft;
  saveDrafts(drafts);

  return updatedDraft;
}

/**
 * Delete a draft
 */
export function deleteDraft(id: string): boolean {
  const drafts = loadDrafts();
  const filteredDrafts = drafts.filter(d => d.id !== id);

  if (filteredDrafts.length === drafts.length) {
    return false; // Draft not found
  }

  saveDrafts(filteredDrafts);
  return true;
}

/**
 * Get a single draft by ID
 */
export function getDraft(id: string): Draft | null {
  const drafts = loadDrafts();
  return drafts.find(d => d.id === id) || null;
}

/**
 * Clear all drafts
 */
export function clearAllDrafts(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DRAFTS_STORAGE_KEY);
  }
}

/**
 * Convert draft to markdown content with frontmatter
 */
export function draftToMarkdown(draft: Draft): string {
  const frontmatter = `---
title: "${draft.title}"
date: ${draft.createdAt.toISOString()}
lastModified: ${draft.updatedAt.toISOString()}
---

`;

  return frontmatter + draft.body;
}

/**
 * Generate filename for a draft
 */
export function generateDraftFilename(draft: Draft, directory: string = 'content'): string {
  const slug = draft.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);

  const dateStr = format(draft.createdAt, 'yyyy-MM-dd');
  const filename = `${dateStr}-${slug || 'untitled'}.md`;

  return directory ? `${directory}/${filename}` : filename;
}

/**
 * Validate draft content
 */
export function validateDraft(draft: Partial<DraftInput>): string[] {
  const errors: string[] = [];

  if (!draft.title || draft.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (draft.title && draft.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }

  if (draft.body && draft.body.length > 100000) {
    errors.push('Content must be less than 100,000 characters');
  }

  return errors;
}

/**
 * Get drafts sorted by last updated
 */
export function getDraftsSortedByUpdated(): Draft[] {
  const drafts = loadDrafts();
  return drafts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

/**
 * Search drafts by title or content
 */
export function searchDrafts(query: string): Draft[] {
  if (!query.trim()) {
    return getDraftsSortedByUpdated();
  }

  const drafts = loadDrafts();
  const lowerQuery = query.toLowerCase();

  return drafts.filter(draft => 
    draft.title.toLowerCase().includes(lowerQuery) ||
    draft.body.toLowerCase().includes(lowerQuery)
  ).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}
