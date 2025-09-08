'use client';

import { useState, useEffect } from 'react';

interface GitHubContent {
  markdownContent: string;
  htmlContent: string;
  filePath: string;
}

export default function GitHubContentViewer() {
  const [filePath, setFilePath] = useState('content/path.md');
  const [content, setContent] = useState<GitHubContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'rendered' | 'markdown'>('rendered');
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const fetchAvailableFiles = async () => {
    setLoadingFiles(true);
    try {
      const response = await fetch('/api/github/list?directory=content');
      const data = await response.json();
      
      if (response.ok) {
        setAvailableFiles(data.data.files);
      } else {
        console.error('Failed to fetch available files:', data.error);
      }
    } catch (err) {
      console.error('Error fetching available files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchContent = async () => {
    if (!filePath.trim()) {
      setError('Please enter a file path');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/github/fetch?path=${encodeURIComponent(filePath)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch content');
      }

      setContent(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setContent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (selectedFile: string) => {
    setFilePath(selectedFile);
    setShowDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContent();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Fetch GitHub Content
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="filePath" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                File Path (e.g., content/hello.md)
              </label>
              <button
                type="button"
                onClick={fetchAvailableFiles}
                disabled={loadingFiles}
                className="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 
                          text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 
                          hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 
                          focus:ring-offset-2 focus:ring-blue-500 disabled:cursor-not-allowed"
              >
                {loadingFiles ? (
                  <>
                    <svg className="animate-spin -ml-0.5 mr-1 h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  'Browse Files'
                )}
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                id="filePath"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                onFocus={() => availableFiles.length > 0 && setShowDropdown(true)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                          focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white
                          disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                placeholder="Enter file path or browse available files..."
                disabled={loading}
                required
              />
              
              {showDropdown && availableFiles.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-auto">
                  {availableFiles.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                      No markdown files found in content/
                    </div>
                  ) : (
                    availableFiles.map((file) => (
                      <button
                        key={file}
                        type="button"
                        onClick={() => handleFileSelect(file)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 
                                  hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600"
                      >
                        {file}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {availableFiles.length > 0 && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Found {availableFiles.length} markdown file{availableFiles.length !== 1 ? 's' : ''} in content/
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md 
                       shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
                       focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              'Fetch Content'
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Error</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {content && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {content.filePath}
              </h3>
              <div className="flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => setViewMode('rendered')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                    viewMode === 'rendered'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                  }`}
                >
                  Rendered
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('markdown')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
                    viewMode === 'markdown'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                  }`}
                >
                  Markdown
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {viewMode === 'rendered' ? (
              <div 
                className="prose prose-gray dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content.htmlContent }}
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto">
                {content.markdownContent}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
