import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create a window object for server-side rendering
const createWindow = () => {
  if (typeof window !== 'undefined') {
    return window;
  }
  
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  return dom.window;
};

/**
 * Parse markdown content to HTML
 */
export function parseMarkdown(markdownContent: string): string {
  try {
    marked.setOptions({
      gfm: true, 
      breaks: true,
    });

    const htmlContent = marked(markdownContent);
    return htmlContent as string;
  } catch (error) {
    console.error('Error parsing markdown:', error);
    return `<p>Error parsing markdown content</p>`;
  }
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHTML(htmlContent: string): string {
  try {
    const window = createWindow();
    const purify = DOMPurify(window);
    
    // Configure DOMPurify options
    const cleanHTML = purify.sanitize(htmlContent, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'strong', 'em', 'u', 'del', 'code',
        'pre', 'blockquote',
        'ul', 'ol', 'li',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'a', 'img',
        'div', 'span',
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'alt', 'src',
        'class', 'id',
        'target', 'rel',
      ],
      ALLOW_DATA_ATTR: false,
    });

    return cleanHTML;
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    return '<p>Error processing content</p>';
  }
}

/**
 * Convert markdown to sanitized HTML
 */
export function markdownToHTML(markdownContent: string): string {
  const htmlContent = parseMarkdown(markdownContent);
  return sanitizeHTML(htmlContent);
}

/**
 * Extract title from markdown content (first heading or first line)
 */
export function extractMarkdownTitle(markdownContent: string): string {
  const lines = markdownContent.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.substring(2).trim();
    }
  }
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('---')) {
      return trimmed.substring(0, 100);
    }
  }
  
  return 'Untitled';
}

/**
 * Create a slug from title for file naming
 */
export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Generate markdown frontmatter
 */
export function generateFrontmatter(title: string, date: Date = new Date()): string {
  return `---
title: "${title}"
date: ${date.toISOString()}
draft: false
---

`;
}
